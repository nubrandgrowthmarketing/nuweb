import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DesignDirectionBoard } from "@/components/design/DesignDirectionBoard";

export default async function DesignDirectionPage({
  params,
}: PageProps<"/projects/[slug]/design-direction">) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: { designLinks: { orderBy: { createdAt: "desc" } } },
  });
  if (!project) notFound();

  return <DesignDirectionBoard slug={project.slug} designLinks={project.designLinks} />;
}
