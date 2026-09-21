import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const media = await db.mediaAsset.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ media });
}

// Called by the client right after a successful direct-to-Blob upload
// (see /media/upload) to record the asset against this project.
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
  const url = typeof body?.url === "string" ? body.url : "";
  const filename = typeof body?.filename === "string" ? body.filename : "upload";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";

  if (!url || !url.includes(`/media/${slug}/`)) {
    return NextResponse.json({ error: "Invalid or missing upload url" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 400 });
  }

  const media = await db.mediaAsset.create({
    data: {
      projectId: project.id,
      url,
      filename,
      mimeType,
      kind: mimeType.startsWith("video/") ? "VIDEO" : "IMAGE",
    },
  });

  return NextResponse.json({ media }, { status: 201 });
}
