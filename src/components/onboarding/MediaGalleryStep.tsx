"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { MediaAsset, Onboarding } from "@prisma/client";

const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,video/mp4,video/webm,video/quicktime,video/ogg";
const ACCEPTED_SET = new Set(ACCEPTED_TYPES.split(","));

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB
const UPLOAD_CONCURRENCY = 3;

type UploadStatus = "queued" | "uploading" | "saving" | "done" | "error";

type UploadItem = {
  id: string;
  name: string;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

const STATUS_LABEL: Record<UploadStatus, string> = {
  queued: "Waiting…",
  uploading: "Uploading…",
  saving: "Saving…",
  done: "Added to gallery",
  error: "Failed",
};

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
  const fileMapRef = useRef<Map<string, File>>(new Map());
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);

  const isUploading = uploadItems.some((it) => it.status === "queued" || it.status === "uploading" || it.status === "saving");

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setUploadItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function uploadOne(file: File, itemId: string) {
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

    if (!ACCEPTED_SET.has(file.type)) {
      updateItem(itemId, { status: "error", error: `Unsupported type: ${file.type || "unknown"}` });
      return;
    }
    if (file.size > maxSize) {
      updateItem(itemId, { status: "error", error: `Exceeds ${formatBytes(maxSize)} limit` });
      return;
    }

    updateItem(itemId, { status: "uploading", progress: 0 });

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(new Error("Upload timed out after 10 minutes")),
      10 * 60 * 1000,
    );

    try {
      const pathname = `media/${slug}/${crypto.randomUUID()}-${file.name}`;
      const blob = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: `/api/projects/${slug}/media/upload`,
        clientPayload: JSON.stringify({ mimeType: file.type }),
        multipart: file.size > 5 * 1024 * 1024,
        abortSignal: controller.signal,
        onUploadProgress: ({ percentage }) => {
          updateItem(itemId, { progress: Math.round(percentage) });
        },
      });
      clearTimeout(timeoutId);

      updateItem(itemId, { status: "saving", progress: 100 });

      const res = await fetch(`/api/projects/${slug}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, filename: file.name, mimeType: file.type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        updateItem(itemId, { status: "error", error: data.error ?? "Could not save to gallery" });
        return;
      }

      updateItem(itemId, { status: "done" });
      router.refresh();
    } catch (err) {
      clearTimeout(timeoutId);
      const message = err instanceof Error ? err.message : "Upload failed";
      updateItem(itemId, { status: "error", error: message });
    }
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const items: UploadItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      status: "queued",
      progress: 0,
    }));
    for (let i = 0; i < files.length; i++) {
      fileMapRef.current.set(items[i].id, files[i]);
    }
    setUploadItems((prev) => [...prev, ...items]);

    const queue = files.map((file, i) => ({ file, id: items[i].id }));
    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const { file, id } = queue[cursor++];
        await uploadOne(file, id);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, worker),
    );

    if (fileInput.current) fileInput.current.value = "";
  }

  function retryItem(id: string) {
    const file = fileMapRef.current.get(id);
    if (!file) return;
    void uploadOne(file, id);
  }

  function retryAllFailed() {
    uploadItems.filter((it) => it.status === "error").forEach((it) => retryItem(it.id));
  }

  function clearFinishedUploads() {
    setUploadItems((prev) => {
      const kept = prev.filter((it) => it.status !== "done" && it.status !== "error");
      const keptIds = new Set(kept.map((it) => it.id));
      for (const id of fileMapRef.current.keys()) {
        if (!keptIds.has(id)) fileMapRef.current.delete(id);
      }
      return kept;
    });
  }

  async function assign(assetId: string, role: "logo" | "favicon" | null) {
    await fetch(`/api/projects/${slug}/media/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedAs: role }),
    });
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

  const allFinished = uploadItems.length > 0 && !isUploading;
  const doneCount = uploadItems.filter((it) => it.status === "done").length;
  const errorCount = uploadItems.filter((it) => it.status === "error").length;

  return (
    <div>
      <h2 className="text-lg font-semibold">Media Gallery</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Upload brand assets and videos, then assign which image is the logo and which is the
        favicon.
      </p>

      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 px-6 py-8 text-center hover:border-neutral-400">
        <span className="text-sm font-medium text-neutral-700">
          {isUploading ? "Uploading…" : "Click to upload images or videos"}
        </span>
        <span className="mt-1 text-xs text-neutral-400">
          PNG, JPG, WEBP, SVG, ICO up to 10MB · MP4, WEBM, MOV, OGG up to 200MB · multiple files OK
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

      {uploadItems.length > 0 && (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">
              {isUploading
                ? `Uploading ${uploadItems.length} file${uploadItems.length === 1 ? "" : "s"}…`
                : `${doneCount} added to gallery${errorCount ? `, ${errorCount} failed` : ""}`}
            </p>
            {allFinished && (
              <div className="flex items-center gap-3">
                {errorCount > 0 && (
                  <button
                    onClick={retryAllFailed}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                  >
                    Retry {errorCount} failed
                  </button>
                )}
                <button
                  onClick={clearFinishedUploads}
                  className="text-xs font-medium text-neutral-400 hover:text-neutral-600"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {uploadItems.map((item) => (
              <li key={item.id} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-neutral-700" title={item.name}>
                    {item.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={
                        item.status === "error"
                          ? "text-red-600"
                          : item.status === "done"
                            ? "text-emerald-600"
                            : "text-neutral-400"
                      }
                    >
                      {item.status === "error" ? item.error : STATUS_LABEL[item.status]}
                    </span>
                    {item.status === "error" && (
                      <button
                        onClick={() => retryItem(item.id)}
                        className="font-medium text-neutral-600 underline hover:text-neutral-900"
                      >
                        Retry
                      </button>
                    )}
                  </span>
                </div>
                {(item.status === "uploading" || item.status === "saving") && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all"
                      style={{ width: `${item.status === "saving" ? 100 : item.progress}%` }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {media.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-400">No media uploaded yet.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {media.map((asset) => {
            const isVideo = asset.mimeType.startsWith("video/");
            const isLogo = onboarding?.logoAssetId === asset.id || asset.assignedAs === "logo";
            const isFavicon = onboarding?.faviconAssetId === asset.id || asset.assignedAs === "favicon";
            const fileUrl = `/api/projects/${slug}/media/${asset.id}/file`;
            return (
              <li key={asset.id} className="rounded-lg border border-neutral-200 p-2">
                <div className="relative flex h-24 items-center justify-center overflow-hidden rounded bg-neutral-50">
                  {isVideo ? (
                    <video src={fileUrl} className="h-full w-full object-contain" controls muted />
                  ) : (
                    <Image
                      src={fileUrl}
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
