import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";
import { CHAT_TOOLS, executeChatTool } from "@/lib/chatTools";
import { buildSystemPrompt } from "@/lib/chatContext";

const CONTEXT_INCLUDE = {
  onboarding: true,
  designLinks: true,
  designReviews: true,
  previews: true,
  formIntegration: true,
  reviewsIntegration: true,
} as const;

const MAX_TOOL_TURNS = 5;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const messages = await db.chatMessage.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: CONTEXT_INCLUDE,
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const userText = typeof body?.message === "string" ? body.message.trim() : "";
  if (!userText) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  await db.chatMessage.create({
    data: { projectId: project.id, role: "USER", content: userText },
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured on the server. Add it to your .env file to enable chat.",
      },
      { status: 500 },
    );
  }

  const history = await db.chatMessage.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  const client = getAnthropicClient();
  const systemPrompt = buildSystemPrompt(project);

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role === "ASSISTANT" ? "assistant" : "user",
    content: m.content,
  }));

  let finalText = "";
  const actions: string[] = [];

  try {
    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        tools: CHAT_TOOLS,
        messages,
      });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === "text",
      );
      if (textBlocks.length > 0) {
        finalText = textBlocks.map((b) => b.text).join("\n\n");
      }

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
        break;
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        const result = await executeChatTool(project.id, toolUse.name, toolUse.input);
        actions.push(result.summary);
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result.message,
          is_error: result.isError,
        });
      }
      messages.push({ role: "user", content: toolResults });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error contacting Claude";
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  const assistantMessage = await db.chatMessage.create({
    data: {
      projectId: project.id,
      role: "ASSISTANT",
      content: finalText || "Done.",
    },
  });

  return NextResponse.json({ message: assistantMessage, actions });
}
