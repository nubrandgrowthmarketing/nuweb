"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { MediaAsset, Onboarding } from "@prisma/client";

const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,video/mp4,video/webm,video/quicktime,video/ogg";

export function MediaGalleryStep({
  slug,
  media,
  onboarding,
  onBack,
  onNext,
}: {
  slug: string;
  media: MediaAsset[];
  onboarding: Onboarding | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      try {
        const pathname = `media/${slug}/${crypto.randomUUID()}-${file.name}`;
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: `/api/projects/${slug}/media/upload`,
          clientPayload: JSON.stringify({ mimeType: file.type }),
          multipart: file.size > 5 * 1024 * 1024,
        });

        const res = await fetch(`/api/projects/${slug}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: blob.url, filename: file.name, mimeType: file.type }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? `Failed to save ${file.name}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to upload ${file.name}`;
        setError(message);
      }
    }

    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  async function assign(assetId: string, role: "logo" | "favicon" | null) {
    const res = await fetch(`/api/projects/${slug}/media/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedAs: role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update assignment");
    }
    router.refresh();
  }

  async function remove(assetId: string) {
    await fetch(`/api/projects/${slug}/media/${assetId}`, { method: "DELETE" });
    router.refresh();
  }

  async function advance() {
    await fetch(`/api/projects/${slug}/onboarding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 3 }),
    });
    router.refresh();
    onNext();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Media Gallery</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Upload brand assets and videos, then assign which image is the logo and which is the
        favicon.
      </p>

      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 px-6 py-8 text-center hover:border-neutral-400">
        <span className="text-sm font-medium text-neutral-700">
          {uploading ? "Uploading…" : "Click to upload images or videos"}
        </span>
        <span className="mt-1 text-xs text-neutral-400">
          PNG, JPG, WEBP, SVG, ICO up to 10MB · MP4, WEBM, MOV, OGG up to 200MB
        </span>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {media.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-400">No media uploaded yet.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {media.map((asset) => {
            const isVideo = asset.mimeType.startsWith("video/");
            const isLogo = onboarding?.logoAssetId === asset.id || asset.assignedAs === "logo";
            const isFavicon = onboarding?.faviconAssetId === asset.id || asset.assignedAs === "favicon";
            return (
              <li key={asset.id} className="rounded-lg border border-neutral-200 p-2">
                <div className="relative flex h-24 items-center justify-center overflow-hidden rounded bg-neutral-50">
                  {isVideo ? (
                    <video src={asset.url} className="h-full w-full object-contain" controls muted />
                  ) : (
                    <Image
                      src={asset.url}
                      alt={asset.filename}
                      fill
                      sizes="150px"
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
                <p className="mt-2 truncate text-xs text-neutral-500" title={asset.filename}>
                  {asset.filename}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {!isVideo && (
                    <>
                      <button
                        onClick={() => assign(asset.id, isLogo ? null : "logo")}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          isLogo
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        {isLogo ? "✓ Logo" : "Set logo"}
                      </button>
                      <button
                        onClick={() => assign(asset.id, isFavicon ? null : "favicon")}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          isFavicon
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        {isFavicon ? "✓ Favicon" : "Set favicon"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => remove(asset.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Back
        </button>
        <button
          onClick={advance}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Save &amp; continue →
        </button>
      </div>
    </div>
  );
}
