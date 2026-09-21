import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

async function createProject(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const base = slugify(name);
  let slug = base;
  let attempt = 0;
  while (await db.project.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  const project = await db.project.create({
    data: {
      name,
      slug,
      onboarding: { create: {} },
    },
  });

  redirect(`/projects/${project.slug}/onboarding`);
}

export default function NewProjectPage() {
  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">New Client Project</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Give it a name — you can fill in the rest during onboarding.
      </p>

      <form action={createProject} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
            Client / project name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            placeholder="Acme Corp Website Redesign"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Create project
        </button>
      </form>
    </div>
  );
}
