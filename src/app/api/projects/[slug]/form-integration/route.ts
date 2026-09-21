import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: { formIntegration: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ formIntegration: project.formIntegration });
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
  const provider = typeof body?.provider === "string" ? body.provider : "webhook";
  const destination = typeof body?.destination === "string" ? body.destination.trim() : "";
  const fieldMapping = typeof body?.fieldMapping === "string" ? body.fieldMapping : null;
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : true;

  if (!destination) {
    return NextResponse.json(
      { error: "destination (webhook URL or notification email) is required" },
      { status: 400 },
    );
  }

  const formIntegration = await db.formIntegration.upsert({
    where: { projectId: project.id },
    update: { provider, destination, fieldMapping, isActive },
    create: { projectId: project.id, provider, destination, fieldMapping, isActive },
  });

  return NextResponse.json({ formIntegration });
}
