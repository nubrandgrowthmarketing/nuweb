import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db } from "@/lib/db";

const ALLOWED_CONTENT_TYPES = [
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
];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith(`media/${slug}/`)) {
          throw new Error("Invalid upload path for this project");
        }
        const contentType =
          typeof clientPayload === "string" ? JSON.parse(clientPayload).mimeType : undefined;
        const isVideo = typeof contentType === "string" && contentType.startsWith("video/");
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async () => {
        // The client confirms the upload and creates the MediaAsset row via
        // POST /api/projects/[slug]/media right after upload() resolves, so
        // nothing to do here — this hook exists mainly for cases where the
        // uploading client disappears before confirming, which we accept.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload token generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
