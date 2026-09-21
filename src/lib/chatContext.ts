import type { Prisma } from "@prisma/client";

export type ProjectWithContext = Prisma.ProjectGetPayload<{
  include: {
    onboarding: true;
    designLinks: true;
    designReviews: true;
    previews: true;
    formIntegration: true;
    reviewsIntegration: true;
  };
}>;

export function buildSystemPrompt(project: ProjectWithContext): string {
  const o = project.onboarding;

  const lines: string[] = [
    `You are the in-house AI assistant inside "nuweb Studio", an agency's website builder tool.`,
    `You are embedded in the workspace for client project "${project.name}" (stage: ${project.stage}).`,
    `The person chatting with you is an agency team member directing work on this client's website.`,
    `You have tools to update onboarding info, add Figma design links, log design review comments, change the project stage, and add AI/live preview links. Use them when the user asks you to record, save, change, or add something. Otherwise just answer conversationally.`,
    `After using tools, briefly confirm what you changed in plain language.`,
    ``,
    `## Current project context`,
    `Business name: ${o?.businessName || "(not set)"}`,
    `Contact: ${o?.contactName || "(not set)"} ${o?.contactEmail ? `<${o.contactEmail}>` : ""}`,
    `Website goals: ${o?.websiteGoals || "(not set)"}`,
    `Target audience: ${o?.targetAudience || "(not set)"}`,
    `Brand voice: ${o?.brandVoice || "(not set)"}`,
    `Competitors: ${o?.competitors || "(not set)"}`,
    `Additional notes: ${o?.additionalNotes || "(none)"}`,
    ``,
    `Design links (${project.designLinks.length}): ${
      project.designLinks.map((l) => `${l.title} - ${l.figmaUrl}`).join(" | ") || "none yet"
    }`,
    `Design review comments (${project.designReviews.length}): ${
      project.designReviews
        .slice(-5)
        .map((r) => `[${r.status}] ${r.comment}`)
        .join(" | ") || "none yet"
    }`,
    `Preview links: ${
      project.previews.map((p) => `${p.kind}: ${p.url}`).join(" | ") || "none yet"
    }`,
    `Form submissions integration: ${
      project.formIntegration
        ? `${project.formIntegration.provider} -> ${project.formIntegration.destination}`
        : "not configured"
    }`,
    `Google reviews integration: ${
      project.reviewsIntegration?.placeId || project.reviewsIntegration?.listingUrl
        ? "configured"
        : "not configured"
    }`,
  ];

  return lines.join("\n");
}
