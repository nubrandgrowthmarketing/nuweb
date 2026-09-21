# nuweb Studio

An agency website builder / client workspace. Every client site moves through
a pipeline of tabs — **Onboarding → Design Direction → Design Review → AI
Preview → Live Preview** — and a persistent chat panel lets the team direct
Claude to update project data (onboarding fields, Figma links, review notes,
stage, preview URLs) using plain language.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **Prisma + SQLite** for local data (client/project records, media, chat history)
- **@anthropic-ai/sdk** (`claude-opus-5`) for the in-app chat/command box, with
  tool-calling so Claude can act on the project, not just talk about it

## Getting started

```bash
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY (and optionally GOOGLE_PLACES_API_KEY)
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create a project, and
work through its tabs. The bottom-right/right-hand chat panel talks to Claude
about that specific project — the API key must be set for it to respond.

## Data model

See `prisma/schema.prisma`. Each `Project` has one `Onboarding` record,
many `MediaAsset`s (the logo/favicon gallery), one `FormIntegration`, one
`GoogleReviewsIntegration`, many `DesignLink`s (Figma mockups), many
`DesignReview`s (approval/feedback), many `PreviewLink`s (AI + live preview
URLs), and a `ChatMessage` transcript.

## Feature tour

- **Onboarding** (`/projects/[slug]/onboarding`) — a 4-step wizard: client
  info, media gallery (upload + assign logo/favicon), form-submission
  delivery settings, and Google Reviews (Place ID + sync).
- **Design Direction** (`/design-direction`) — share Figma links with an
  inline embed preview.
- **Design Review** (`/design-review`) — threaded feedback with
  pending/approved/changes-requested status per comment.
- **AI Preview** / **Live Preview** — add and view preview URLs in an iframe.
- **Chat panel** — persists per-project history in `ChatMessage` and can call
  tools to update onboarding fields, add design links/review comments, change
  the project stage, or add preview links, so directions given in chat show
  up immediately in the relevant tab.

## Notes on integrations

- **Form submissions**: this stores *where* submissions should go (webhook
  URL, notification email, etc.) — wiring an actual site's contact form to
  post there is left to the site implementation.
- **Google Reviews**: stores a Place ID and the *name* of an environment
  variable holding the API key (never the key itself) and fetches via the
  Places Details API on demand ("Sync reviews now").
