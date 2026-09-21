import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { STAGES } from "@/lib/stages";

const ONBOARDING_FIELDS = [
  "businessName",
  "contactName",
  "contactEmail",
  "contactPhone",
  "websiteGoals",
  "targetAudience",
  "brandVoice",
  "competitors",
  "additionalNotes",
] as const;

const REVIEW_STATUSES = ["PENDING", "APPROVED", "CHANGES_REQUESTED"] as const;
const PREVIEW_KINDS = ["AI_PREVIEW", "LIVE_PREVIEW"] as const;

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "update_onboarding_field",
    description:
      "Update a single field on the client's onboarding intake form (business info, goals, audience, brand voice, etc).",
    input_schema: {
      type: "object",
      properties: {
        field: { type: "string", enum: [...ONBOARDING_FIELDS] },
        value: { type: "string" },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "add_design_link",
    description: "Add a Figma mockup link to the project's Design Direction tab.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        figmaUrl: { type: "string" },
        notes: { type: "string" },
      },
      required: ["title", "figmaUrl"],
    },
  },
  {
    name: "add_design_review_comment",
    description:
      "Add a design review note or decision (approve / request changes) on the project's Design Review tab.",
    input_schema: {
      type: "object",
      properties: {
        comment: { type: "string" },
        status: { type: "string", enum: [...REVIEW_STATUSES] },
      },
      required: ["comment"],
    },
  },
  {
    name: "set_project_stage",
    description: "Move the project to a different pipeline stage.",
    input_schema: {
      type: "object",
      properties: {
        stage: { type: "string", enum: [...STAGES] },
      },
      required: ["stage"],
    },
  },
  {
    name: "add_preview_link",
    description: "Add or update an AI Preview or Live Preview URL for the client to view.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: [...PREVIEW_KINDS] },
        url: { type: "string" },
        label: { type: "string" },
      },
      required: ["kind", "url"],
    },
  },
];

export type ToolExecutionResult = {
  summary: string;
  message: string;
  isError: boolean;
};

export async function executeChatTool(
  projectId: string,
  name: string,
  rawInput: unknown,
): Promise<ToolExecutionResult> {
  const input = (rawInput ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case "update_onboarding_field": {
        const field = input.field;
        const value = input.value;
        if (
          typeof field !== "string" ||
          !ONBOARDING_FIELDS.includes(field as (typeof ONBOARDING_FIELDS)[number]) ||
          typeof value !== "string"
        ) {
          return invalid("update_onboarding_field", "field must be a known onboarding field and value a string");
        }
        await db.onboarding.upsert({
          where: { projectId },
          update: { [field]: value },
          create: { projectId, [field]: value },
        });
        return {
          summary: `Updated onboarding field "${field}"`,
          message: `Saved ${field} on the onboarding form.`,
          isError: false,
        };
      }

      case "add_design_link": {
        const title = input.title;
        const figmaUrl = input.figmaUrl;
        const notes = typeof input.notes === "string" ? input.notes : undefined;
        if (typeof title !== "string" || typeof figmaUrl !== "string") {
          return invalid("add_design_link", "title and figmaUrl are required strings");
        }
        await db.designLink.create({
          data: { projectId, title, figmaUrl, notes },
        });
        return {
          summary: `Added Figma link "${title}"`,
          message: `Added Figma mockup "${title}" to Design Direction.`,
          isError: false,
        };
      }

      case "add_design_review_comment": {
        const comment = input.comment;
        const status =
          typeof input.status === "string" &&
          REVIEW_STATUSES.includes(input.status as (typeof REVIEW_STATUSES)[number])
            ? (input.status as (typeof REVIEW_STATUSES)[number])
            : "PENDING";
        if (typeof comment !== "string" || !comment.trim()) {
          return invalid("add_design_review_comment", "comment is a required string");
        }
        await db.designReview.create({
          data: { projectId, comment, status, author: "Claude" },
        });
        return {
          summary: `Added design review comment (${status})`,
          message: `Logged a ${status.toLowerCase()} design review comment.`,
          isError: false,
        };
      }

      case "set_project_stage": {
        const stage = input.stage;
        if (typeof stage !== "string" || !STAGES.includes(stage as (typeof STAGES)[number])) {
          return invalid("set_project_stage", `stage must be one of ${STAGES.join(", ")}`);
        }
        await db.project.update({
          where: { id: projectId },
          data: { stage: stage as (typeof STAGES)[number] },
        });
        return {
          summary: `Moved project to stage ${stage}`,
          message: `Project stage set to ${stage}.`,
          isError: false,
        };
      }

      case "add_preview_link": {
        const kind = input.kind;
        const url = input.url;
        const label = typeof input.label === "string" ? input.label : undefined;
        if (
          typeof kind !== "string" ||
          !PREVIEW_KINDS.includes(kind as (typeof PREVIEW_KINDS)[number]) ||
          typeof url !== "string"
        ) {
          return invalid("add_preview_link", "kind must be AI_PREVIEW or LIVE_PREVIEW and url a string");
        }
        await db.previewLink.create({
          data: { projectId, kind: kind as (typeof PREVIEW_KINDS)[number], url, label },
        });
        return {
          summary: `Added ${kind} link`,
          message: `Added ${kind === "AI_PREVIEW" ? "an AI Preview" : "a Live Preview"} link.`,
          isError: false,
        };
      }

      default:
        return {
          summary: `Unknown tool: ${name}`,
          message: `No tool named "${name}" exists.`,
          isError: true,
        };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      summary: `Tool "${name}" failed`,
      message: `Error running ${name}: ${errorMessage}`,
      isError: true,
    };
  }
}

function invalid(name: string, reason: string): ToolExecutionResult {
  return {
    summary: `Tool "${name}" received invalid input`,
    message: `Invalid input for ${name}: ${reason}`,
    isError: true,
  };
}
