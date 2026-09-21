import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const EDITABLE_FIELDS = [
  "businessName",
  "contactName",
  "contactEmail",
  "contactPhone",
  "websiteGoals",
  "targetAudience",
  "brandVoice",
  "competitors",
  "additionalNotes",
  "step",
  "completed",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug }, include: { onboarding: true } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ onboarding: project.onboarding });
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
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: Record<string, string | number | boolean> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) {
      data[key] = body[key];
    }
  }

  const onboarding = await db.onboarding.upsert({
    where: { projectId: project.id },
    update: data,
    create: { projectId: project.id, ...data },
  });

  return NextResponse.json({ onboarding });
}
