import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";

// The gallery's Blob store is private-access only, so browsers can't load
// asset.url directly (private blobs require the read-write token to fetch).
// This route authenticates server-side and streams the bytes through.
export async function GET(
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

  const result = await get(asset.url, { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || asset.mimeType,
      "Content-Length": String(result.blob.size),
      // The pathname embeds a random id per upload, so content at this URL never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
