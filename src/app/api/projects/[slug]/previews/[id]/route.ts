import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const preview = await db.previewLink.findFirst({ where: { id, projectId: project.id } });
  if (!preview) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }
  await db.previewLink.delete({ where: { id: preview.id } });
  return NextResponse.json({ ok: true });
}
