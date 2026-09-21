import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage({ params }: PageProps<"/projects/[slug]/onboarding">) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: {
      onboarding: true,
      mediaAssets: { orderBy: { createdAt: "desc" } },
      formIntegration: true,
      reviewsIntegration: true,
    },
  });
  if (!project) notFound();

  return (
    <OnboardingWizard
      slug={project.slug}
      onboarding={project.onboarding}
      media={project.mediaAssets}
      formIntegration={project.formIntegration}
      reviewsIntegration={project.reviewsIntegration}
    />
  );
}
