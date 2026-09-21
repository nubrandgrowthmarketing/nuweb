export const STAGES = [
  "ONBOARDING",
  "DESIGN_DIRECTION",
  "DESIGN_REVIEW",
  "AI_PREVIEW",
  "LIVE_PREVIEW",
  "LAUNCHED",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  ONBOARDING: "Onboarding",
  DESIGN_DIRECTION: "Design Direction",
  DESIGN_REVIEW: "Design Review",
  AI_PREVIEW: "AI Preview",
  LIVE_PREVIEW: "Live Preview",
  LAUNCHED: "Launched",
};
