import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DesignReviewBoard } from "@/components/design/DesignReviewBoard";

export default async function DesignReviewPage({
  params,
}: PageProps<"/projects/[slug]/design-review">) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: {
      designLinks: { orderBy: { createdAt: "desc" } },
      designReviews: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  return (
    <DesignReviewBoard
      slug={project.slug}
      designLinks={project.designLinks}
      designReviews={project.designReviews}
    />
  );
}
