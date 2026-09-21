import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProjectTabs } from "@/components/ProjectTabs";
import { ChatPanel } from "@/components/ChatPanel";
import { StageSelect } from "@/components/StageSelect";

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug } });
  if (!project) notFound();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-xs font-medium text-neutral-400 hover:text-neutral-600">
              ← All projects
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          </div>
          <StageSelect slug={project.slug} stage={project.stage} />
        </div>
        <ProjectTabs slug={project.slug} />
      </header>

      <div className="flex flex-1">
        <main className="min-w-0 flex-1 px-6 py-8">{children}</main>
        <ChatPanel slug={project.slug} projectName={project.name} />
      </div>
    </div>
  );
}
