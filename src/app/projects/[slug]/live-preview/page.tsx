import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PreviewPanel } from "@/components/design/PreviewPanel";

export default async function LivePreviewPage({ params }: PageProps<"/projects/[slug]/live-preview">) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: { previews: { where: { kind: "LIVE_PREVIEW" }, orderBy: { createdAt: "desc" } } },
  });
  if (!project) notFound();

  return (
    <PreviewPanel
      slug={project.slug}
      kind="LIVE_PREVIEW"
      title="Live Preview"
      description="The working staging build of the site, wired up to real code and content."
      previews={project.previews}
    />
  );
}
