"use client";

import { useState } from "react";
import type { Onboarding, MediaAsset, FormIntegration, GoogleReviewsIntegration } from "@prisma/client";
import { ClientInfoStep } from "./ClientInfoStep";
import { MediaGalleryStep } from "./MediaGalleryStep";
import { FormIntegrationStep } from "./FormIntegrationStep";
import { GoogleReviewsStep } from "./GoogleReviewsStep";

const STEPS = [
  { id: 1, label: "Client Info" },
  { id: 2, label: "Media Gallery" },
  { id: 3, label: "Form Submissions" },
  { id: 4, label: "Google Reviews" },
];

export function OnboardingWizard({
  slug,
  onboarding,
  media,
  formIntegration,
  reviewsIntegration,
}: {
  slug: string;
  onboarding: Onboarding | null;
  media: MediaAsset[];
  formIntegration: FormIntegration | null;
  reviewsIntegration: GoogleReviewsIntegration | null;
}) {
  const [step, setStep] = useState(onboarding?.step ?? 1);

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => setStep(s.id)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition ${
                step === s.id
                  ? "bg-neutral-900 text-white"
                  : step > s.id
                    ? "bg-neutral-200 text-neutral-600"
                    : "border border-neutral-300 text-neutral-400"
              }`}
            >
              {s.id}
            </button>
            <span
              className={`hidden text-sm sm:inline ${step === s.id ? "font-medium text-neutral-900" : "text-neutral-400"}`}
            >
              {s.label}
            </span>
            {idx < STEPS.length - 1 && <div className="h-px flex-1 bg-neutral-200" />}
          </li>
        ))}
      </ol>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        {step === 1 && (
          <ClientInfoStep slug={slug} onboarding={onboarding} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <MediaGalleryStep
            slug={slug}
            media={media}
            onboarding={onboarding}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <FormIntegrationStep
            slug={slug}
            formIntegration={formIntegration}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <GoogleReviewsStep
            slug={slug}
            reviewsIntegration={reviewsIntegration}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
}
