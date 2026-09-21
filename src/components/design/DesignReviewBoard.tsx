"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DesignLink, DesignReview } from "@prisma/client";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  CHANGES_REQUESTED: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
};

export function DesignReviewBoard({
  slug,
  designLinks,
  designReviews,
}: {
  slug: string;
  designLinks: DesignLink[];
  designReviews: DesignReview[];
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("Agency");
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "CHANGES_REQUESTED">("PENDING");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    await fetch(`/api/projects/${slug}/design-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment, status, author }),
    });
    setSaving(false);
    setComment("");
    router.refresh();
  }

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/projects/${slug}/design-reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  const approvedCount = designReviews.filter((r) => r.status === "APPROVED").length;
  const changesCount = designReviews.filter((r) => r.status === "CHANGES_REQUESTED").length;

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-lg font-semibold">Design Review</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Track feedback and sign-off across {designLinks.length} shared mockup
        {designLinks.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-4 flex gap-3 text-sm">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
          {approvedCount} approved
        </span>
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
          {changesCount} changes requested
        </span>
      </div>

      <form
        onSubmit={submit}
        className="mt-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave feedback on the current design direction…"
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            className="w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approve</option>
            <option value="CHANGES_REQUESTED">Request changes</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            Submit feedback
          </button>
        </div>
      </form>

      {designReviews.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-400">No review feedback yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {designReviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-800">{review.comment}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {review.author} · {new Date(review.createdAt).toLocaleString()}
                  </p>
                </div>
                <select
                  value={review.status}
                  onChange={(e) => updateStatus(review.id, e.target.value)}
                  className={`shrink-0 rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_STYLE[review.status]}`}
                >
                  <option value="PENDING">{STATUS_LABEL.PENDING}</option>
                  <option value="APPROVED">{STATUS_LABEL.APPROVED}</option>
                  <option value="CHANGES_REQUESTED">{STATUS_LABEL.CHANGES_REQUESTED}</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
