"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Onboarding } from "@prisma/client";

type FormState = {
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  websiteGoals: string;
  targetAudience: string;
  brandVoice: string;
  competitors: string;
  additionalNotes: string;
};

function toFormState(onboarding: Onboarding | null): FormState {
  return {
    businessName: onboarding?.businessName ?? "",
    contactName: onboarding?.contactName ?? "",
    contactEmail: onboarding?.contactEmail ?? "",
    contactPhone: onboarding?.contactPhone ?? "",
    websiteGoals: onboarding?.websiteGoals ?? "",
    targetAudience: onboarding?.targetAudience ?? "",
    brandVoice: onboarding?.brandVoice ?? "",
    competitors: onboarding?.competitors ?? "",
    additionalNotes: onboarding?.additionalNotes ?? "",
  };
}

const FIELDS: { name: keyof FormState; label: string; type: "input" | "textarea" }[] = [
  { name: "businessName", label: "Business name", type: "input" },
  { name: "contactName", label: "Primary contact name", type: "input" },
  { name: "contactEmail", label: "Contact email", type: "input" },
  { name: "contactPhone", label: "Contact phone", type: "input" },
  { name: "websiteGoals", label: "Website goals", type: "textarea" },
  { name: "targetAudience", label: "Target audience", type: "textarea" },
  { name: "brandVoice", label: "Brand voice / tone", type: "textarea" },
  { name: "competitors", label: "Competitor websites", type: "textarea" },
  { name: "additionalNotes", label: "Additional onboarding notes", type: "textarea" },
];

export function ClientInfoStep({
  slug,
  onboarding,
  onNext,
}: {
  slug: string;
  onboarding: Onboarding | null;
  onNext: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(onboarding));
  const [saving, setSaving] = useState(false);

  async function save(andAdvance: boolean) {
    setSaving(true);
    await fetch(`/api/projects/${slug}/onboarding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, step: andAdvance ? 2 : 1 }),
    });
    setSaving(false);
    router.refresh();
    if (andAdvance) onNext();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Client Information</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Capture the intake details that will guide design and content.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <label className="block text-sm font-medium text-neutral-700">{field.label}</label>
            {field.type === "input" ? (
              <input
                value={form[field.name]}
                onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            ) : (
              <textarea
                value={form[field.name]}
                onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Save &amp; continue →
        </button>
      </div>
    </div>
  );
}
