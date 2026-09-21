import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  ONBOARDING: "Onboarding",
  DESIGN_DIRECTION: "Design Direction",
  DESIGN_REVIEW: "Design Review",
  AI_PREVIEW: "AI Preview",
  LIVE_PREVIEW: "Live Preview",
  LAUNCHED: "Launched",
};

const STAGE_COLOR: Record<string, string> = {
  ONBOARDING: "bg-amber-100 text-amber-800",
  DESIGN_DIRECTION: "bg-violet-100 text-violet-800",
  DESIGN_REVIEW: "bg-blue-100 text-blue-800",
  AI_PREVIEW: "bg-teal-100 text-teal-800",
  LIVE_PREVIEW: "bg-emerald-100 text-emerald-800",
  LAUNCHED: "bg-neutral-200 text-neutral-800",
};

export default async function DashboardPage() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Client Projects</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every site your agency is building, from onboarding through launch.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-neutral-500">No projects yet.</p>
          <Link
            href="/projects/new"
            className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Start your first client project
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.slug}`}
                className="block rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-medium text-neutral-900">{project.name}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLOR[project.stage]}`}
                  >
                    {STAGE_LABEL[project.stage]}
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-400">
                  Updated {project.updatedAt.toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
