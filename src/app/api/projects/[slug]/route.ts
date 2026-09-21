import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STAGES } from "@/lib/stages";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const stage = body?.stage;
  if (typeof stage !== "string" || !STAGES.includes(stage as (typeof STAGES)[number])) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const updated = await db.project.update({
    where: { id: project.id },
    data: { stage: stage as (typeof STAGES)[number] },
  });

  return NextResponse.json({ project: updated });
}
