"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PreviewLink } from "@prisma/client";

export function PreviewPanel({
  slug,
  kind,
  title,
  description,
  previews,
}: {
  slug: string;
  kind: "AI_PREVIEW" | "LIVE_PREVIEW";
  title: string;
  description: string;
  previews: PreviewLink[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(previews[0]?.id ?? null);

  async function addPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/projects/${slug}/previews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, url, label }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add preview link.");
      return;
    }
    setUrl("");
    setLabel("");
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/projects/${slug}/previews/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const activePreview = previews.find((p) => p.id === active) ?? previews[0];

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>

      <form
        onSubmit={addPreview}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-neutral-500">Preview URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-medium text-neutral-500">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {previews.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-400">
          No {title.toLowerCase()} links yet — add a URL above, or ask Claude in the chat panel
          to add one for you.
        </p>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {previews.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activePreview?.id === p.id
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {p.label || new URL(safeUrl(p.url)).hostname}
              </button>
            ))}
          </div>

          {activePreview && (
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 text-xs text-neutral-500">
                <a href={activePreview.url} target="_blank" rel="noreferrer" className="underline">
                  {activePreview.url}
                </a>
                <button
                  onClick={() => remove(activePreview.id)}
                  className="font-medium text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
              <iframe title={activePreview.label || title} src={activePreview.url} className="h-[600px] w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function safeUrl(value: string): string {
  try {
    new URL(value);
    return value;
  } catch {
    return `https://${value}`;
  }
}
