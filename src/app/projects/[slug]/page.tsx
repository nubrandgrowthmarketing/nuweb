import { redirect } from "next/navigation";

export default async function ProjectRootPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  redirect(`/projects/${slug}/onboarding`);
}
