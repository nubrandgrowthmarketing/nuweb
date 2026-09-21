"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { segment: "onboarding", label: "Onboarding" },
  { segment: "design-direction", label: "Design Direction" },
  { segment: "design-review", label: "Design Review" },
  { segment: "ai-preview", label: "AI Preview" },
  { segment: "live-preview", label: "Live Preview" },
];

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200 px-6">
      {TABS.map((tab) => {
        const href = `/projects/${slug}/${tab.segment}`;
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={tab.segment}
            href={href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
              active
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
