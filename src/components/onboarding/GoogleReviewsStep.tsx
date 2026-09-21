"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { GoogleReviewsIntegration } from "@prisma/client";

type CachedReview = {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
};

export function GoogleReviewsStep({
  slug,
  reviewsIntegration,
  onBack,
}: {
  slug: string;
  reviewsIntegration: GoogleReviewsIntegration | null;
  onBack: () => void;
}) {
  const router = useRouter();
  const [placeId, setPlaceId] = useState(reviewsIntegration?.placeId ?? "");
  const [listingUrl, setListingUrl] = useState(reviewsIntegration?.listingUrl ?? "");
  const [apiKeyRef, setApiKeyRef] = useState(reviewsIntegration?.apiKeyRef ?? "GOOGLE_PLACES_API_KEY");
  const [autoSync, setAutoSync] = useState(reviewsIntegration?.autoSync ?? false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cachedReviews: CachedReview[] = (() => {
    if (!reviewsIntegration?.cachedReviews) return [];
    try {
      const parsed = JSON.parse(reviewsIntegration.cachedReviews);
      return Array.isArray(parsed?.reviews) ? parsed.reviews : [];
    } catch {
      return [];
    }
  })();

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/projects/${slug}/reviews-integration`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, listingUrl, apiKeyRef, autoSync }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save Google reviews settings.");
      return;
    }
    router.refresh();
  }

  async function sync() {
    setSyncing(true);
    setError(null);
    await save();
    const res = await fetch(`/api/projects/${slug}/reviews-integration/sync`, { method: "POST" });
    setSyncing(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not sync Google reviews.");
      return;
    }
    router.refresh();
  }

  async function finishOnboarding() {
    await save();
    await fetch(`/api/projects/${slug}/onboarding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 4, completed: true }),
    });
    await fetch(`/api/projects/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "DESIGN_DIRECTION" }),
    });
    router.push(`/projects/${slug}/design-direction`);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Google Reviews</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Connect the client&rsquo;s Google Business Profile to pull reviews onto the site.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Google Place ID</label>
          <input
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-neutral-400">
            Find it with Google&rsquo;s{" "}
            <span className="underline">Place ID Finder</span> in the Maps Platform docs.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Google listing URL (optional)</label>
          <input
            value={listingUrl}
            onChange={(e) => setListingUrl(e.target.value)}
            placeholder="https://g.page/acme-corp"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Server environment variable holding the API key
          </label>
          <input
            value={apiKeyRef}
            onChange={(e) => setApiKeyRef(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-neutral-400">
            The key itself is never stored in the database — only the name of the env var the
            server should read it from.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Keep reviews automatically in sync
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Save settings
          </button>
          <button
            onClick={sync}
            disabled={syncing || !placeId}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync reviews now"}
          </button>
        </div>

        {reviewsIntegration?.lastSyncedAt && (
          <p className="text-xs text-neutral-400">
            Last synced {new Date(reviewsIntegration.lastSyncedAt).toLocaleString()}
          </p>
        )}

        {cachedReviews.length > 0 && (
          <ul className="mt-2 space-y-2">
            {cachedReviews.slice(0, 5).map((r, i) => (
              <li key={i} className="rounded-md border border-neutral-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.author_name ?? "Anonymous"}</span>
                  <span className="text-amber-500">{"★".repeat(r.rating ?? 0)}</span>
                </div>
                <p className="mt-1 text-neutral-600">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Back
        </button>
        <button
          onClick={finishOnboarding}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Finish onboarding →
        </button>
      </div>
    </div>
  );
}
