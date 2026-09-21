import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const kind = req.nextUrl.searchParams.get("kind");
  const previews = await db.previewLink.findMany({
    where: { projectId: project.id, ...(kind ? { kind: kind as "AI_PREVIEW" | "LIVE_PREVIEW" } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ previews });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const kind = body?.kind;
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const label = typeof body?.label === "string" ? body.label.trim() : null;

  if (!["AI_PREVIEW", "LIVE_PREVIEW"].includes(kind) || !url) {
    return NextResponse.json({ error: "kind (AI_PREVIEW|LIVE_PREVIEW) and url are required" }, { status: 400 });
  }

  const preview = await db.previewLink.create({
    data: { projectId: project.id, kind, url, label },
  });

  return NextResponse.json({ preview }, { status: 201 });
}
