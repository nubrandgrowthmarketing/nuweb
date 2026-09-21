"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DesignLink } from "@prisma/client";

function figmaEmbedUrl(figmaUrl: string): string {
  return `https://www.figma.com/embed?embed_host=nuweb&url=${encodeURIComponent(figmaUrl)}`;
}

export function DesignDirectionBoard({
  slug,
  designLinks,
}: {
  slug: string;
  designLinks: DesignLink[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(designLinks[0]?.id ?? null);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !figmaUrl.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/projects/${slug}/design-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, figmaUrl, notes }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add design link.");
      return;
    }
    setTitle("");
    setFigmaUrl("");
    setNotes("");
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/projects/${slug}/design-links/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-lg font-semibold">Design Direction</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Share Figma mockups here for the client and team to align on direction before build.
      </p>

      <form
        onSubmit={addLink}
        className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-2"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Mockup title (e.g. Homepage v1)"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <input
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
          placeholder="Figma share URL"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes for this direction (optional)"
          rows={2}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none sm:col-span-2"
        />
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
        >
          Add Figma link
        </button>
      </form>

      {designLinks.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-400">No design mockups shared yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {designLinks.map((link) => (
            <li key={link.id} className="rounded-lg border border-neutral-200 bg-white">
              <button
                onClick={() => setExpanded(expanded === link.id ? null : link.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="font-medium">{link.title}</p>
                  {link.notes && <p className="mt-0.5 text-sm text-neutral-500">{link.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    {expanded === link.id ? "Hide preview" : "Show preview"}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(link.id);
                    }}
                    className="cursor-pointer text-xs font-medium text-red-500 hover:underline"
                  >
                    Remove
                  </span>
                </div>
              </button>
              {expanded === link.id && (
                <div className="border-t border-neutral-200 p-2">
                  <iframe
                    title={link.title}
                    src={figmaEmbedUrl(link.figmaUrl)}
                    className="h-[480px] w-full rounded"
                    allowFullScreen
                  />
                  <a
                    href={link.figmaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-neutral-500 underline"
                  >
                    Open in Figma
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
