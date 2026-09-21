"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { STAGES, STAGE_LABEL, type Stage } from "@/lib/stages";

export function StageSelect({ slug, stage }: { slug: string; stage: Stage }) {
  const router = useRouter();
  const [current, setCurrent] = useState(stage);
  const [isPending, startTransition] = useTransition();

  async function handleChange(next: Stage) {
    setCurrent(next);
    await fetch(`/api/projects/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as Stage)}
      className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 focus:outline-none disabled:opacity-60"
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {STAGE_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
