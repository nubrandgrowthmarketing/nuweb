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
  const link = await db.designLink.findFirst({ where: { id, projectId: project.id } });
  if (!link) {
    return NextResponse.json({ error: "Design link not found" }, { status: 404 });
  }
  await db.designLink.delete({ where: { id: link.id } });
  return NextResponse.json({ ok: true });
}
