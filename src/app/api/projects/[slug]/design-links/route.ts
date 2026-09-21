import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const designLinks = await db.designLink.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ designLinks });
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
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const figmaUrl = typeof body?.figmaUrl === "string" ? body.figmaUrl.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes : null;

  if (!title || !figmaUrl) {
    return NextResponse.json({ error: "title and figmaUrl are required" }, { status: 400 });
  }

  const designLink = await db.designLink.create({
    data: { projectId: project.id, title, figmaUrl, notes },
  });

  return NextResponse.json({ designLink }, { status: 201 });
}
