import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
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

  const integration = project.reviewsIntegration;
  if (!integration?.placeId) {
    return NextResponse.json(
      { error: "Set a Google Place ID before syncing reviews." },
      { status: 400 },
    );
  }

  const apiKey = integration.apiKeyRef ? process.env[integration.apiKeyRef] : process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: `No API key found. Set the ${integration.apiKeyRef || "GOOGLE_PLACES_API_KEY"} environment variable on the server.`,
      },
      { status: 500 },
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", integration.placeId);
  url.searchParams.set("fields", "reviews,rating,user_ratings_total,name");
  url.searchParams.set("key", apiKey);

  let payload: unknown;
  try {
    const res = await fetch(url.toString());
    payload = await res.json();
    if (!res.ok || (payload as { status?: string })?.status !== "OK") {
      const status = (payload as { status?: string; error_message?: string })?.status;
      const message = (payload as { error_message?: string })?.error_message;
      return NextResponse.json(
        { error: `Google Places API error${status ? ` (${status})` : ""}: ${message || "unknown error"}` },
        { status: 502 },
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to reach Google Places API: ${message}` }, { status: 502 });
  }

  const updated = await db.googleReviewsIntegration.update({
    where: { projectId: project.id },
    data: {
      cachedReviews: JSON.stringify((payload as { result?: unknown }).result ?? {}),
      lastSyncedAt: new Date(),
    },
  });

  return NextResponse.json({ reviewsIntegration: updated });
}
