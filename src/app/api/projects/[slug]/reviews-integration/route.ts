import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: { reviewsIntegration: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ reviewsIntegration: project.reviewsIntegration });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const placeId = typeof body?.placeId === "string" ? body.placeId.trim() || null : null;
  const listingUrl = typeof body?.listingUrl === "string" ? body.listingUrl.trim() || null : null;
  const apiKeyRef = typeof body?.apiKeyRef === "string" ? body.apiKeyRef.trim() || null : null;
  const autoSync = typeof body?.autoSync === "boolean" ? body.autoSync : false;

  const reviewsIntegration = await db.googleReviewsIntegration.upsert({
    where: { projectId: project.id },
    update: { placeId, listingUrl, apiKeyRef, autoSync },
    create: { projectId: project.id, placeId, listingUrl, apiKeyRef, autoSync },
  });

  return NextResponse.json({ reviewsIntegration });
}
