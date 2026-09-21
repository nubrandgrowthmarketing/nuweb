"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormIntegration } from "@prisma/client";

export function FormIntegrationStep({
  slug,
  formIntegration,
  onBack,
  onNext,
}: {
  slug: string;
  formIntegration: FormIntegration | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState(formIntegration?.provider ?? "webhook");
  const [destination, setDestination] = useState(formIntegration?.destination ?? "");
  const [isActive, setIsActive] = useState(formIntegration?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(andAdvance: boolean) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/projects/${slug}/form-integration`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, destination, isActive }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save form integration.");
      return;
    }
    await fetch(`/api/projects/${slug}/onboarding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: andAdvance ? 4 : 3 }),
    });
    router.refresh();
    if (andAdvance) onNext();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Form Submissions</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Choose where this site&rsquo;s contact/lead form submissions should be delivered.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Delivery method</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          >
            <option value="webhook">Webhook URL</option>
            <option value="email">Notification email</option>
            <option value="zapier">Zapier webhook</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            {provider === "email" ? "Notification email" : "Destination URL"}
          </label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={provider === "email" ? "team@agency.com" : "https://hooks.example.com/..."}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Integration is active
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          ← Back
        </button>
        <div className="flex gap-2">
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
    </div>
  );
}
