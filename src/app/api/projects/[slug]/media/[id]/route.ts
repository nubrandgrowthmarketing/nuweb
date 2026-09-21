import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
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

  const asset = await db.mediaAsset.findFirst({ where: { id, projectId: project.id } });
  if (!asset) {
    return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const assignedAs = body?.assignedAs;
  if (assignedAs !== "logo" && assignedAs !== "favicon" && assignedAs !== null) {
    return NextResponse.json({ error: "assignedAs must be 'logo', 'favicon', or null" }, { status: 400 });
  }
  if ((assignedAs === "logo" || assignedAs === "favicon") && asset.mimeType.startsWith("video/")) {
    return NextResponse.json({ error: "A video can't be used as a logo or favicon" }, { status: 400 });
  }

  if (assignedAs === "logo" || assignedAs === "favicon") {
    // Only one asset can hold each assignment per project.
    await db.mediaAsset.updateMany({
      where: { projectId: project.id, assignedAs },
      data: { assignedAs: null },
    });
  }

  const baseKind = asset.mimeType.startsWith("video/") ? "VIDEO" : "IMAGE";
  const updated = await db.mediaAsset.update({
    where: { id: asset.id },
    data: {
      assignedAs,
      kind: assignedAs === "logo" ? "LOGO" : assignedAs === "favicon" ? "FAVICON" : baseKind,
    },
  });

  await db.onboarding.upsert({
    where: { projectId: project.id },
    update: {
      ...(assignedAs === "logo" ? { logoAssetId: asset.id } : {}),
      ...(assignedAs === "favicon" ? { faviconAssetId: asset.id } : {}),
    },
    create: {
      projectId: project.id,
      ...(assignedAs === "logo" ? { logoAssetId: asset.id } : {}),
      ...(assignedAs === "favicon" ? { faviconAssetId: asset.id } : {}),
    },
  });

  return NextResponse.json({ media: updated });
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

  const asset = await db.mediaAsset.findFirst({ where: { id, projectId: project.id } });
  if (!asset) {
    return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
  }

  await db.mediaAsset.delete({ where: { id: asset.id } });
  await del(asset.url).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
