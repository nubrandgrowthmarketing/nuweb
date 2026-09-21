import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const review = await db.designReview.findFirst({ where: { id, projectId: project.id } });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!["PENDING", "APPROVED", "CHANGES_REQUESTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await db.designReview.update({ where: { id: review.id }, data: { status } });
  return NextResponse.json({ designReview: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const review = await db.designReview.findFirst({ where: { id, projectId: project.id } });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  await db.designReview.delete({ where: { id: review.id } });
  return NextResponse.json({ ok: true });
}
