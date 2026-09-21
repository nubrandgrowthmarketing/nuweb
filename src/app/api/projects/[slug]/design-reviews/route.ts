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
  const designReviews = await db.designReview.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ designReviews });
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
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";
  const status = ["PENDING", "APPROVED", "CHANGES_REQUESTED"].includes(body?.status)
    ? body.status
    : "PENDING";
  const author = typeof body?.author === "string" && body.author.trim() ? body.author.trim() : "Agency";

  if (!comment) {
    return NextResponse.json({ error: "comment is required" }, { status: 400 });
  }

  const designReview = await db.designReview.create({
    data: { projectId: project.id, comment, status, author },
  });

  return NextResponse.json({ designReview }, { status: 201 });
}
