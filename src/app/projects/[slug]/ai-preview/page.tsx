import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PreviewPanel } from "@/components/design/PreviewPanel";

export default async function AiPreviewPage({ params }: PageProps<"/projects/[slug]/ai-preview">) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: { previews: { where: { kind: "AI_PREVIEW" }, orderBy: { createdAt: "desc" } } },
  });
  if (!project) notFound();

  return (
    <PreviewPanel
      slug={project.slug}
      kind="AI_PREVIEW"
      title="AI Preview"
      description="AI-generated draft of the site, based on onboarding info and design direction, for a fast first look."
      previews={project.previews}
    />
  );
}
