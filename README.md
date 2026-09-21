# nuweb Studio

An agency website builder / client workspace. Every client site moves through
a pipeline of tabs — **Onboarding → Design Direction → Design Review → AI
Preview → Live Preview** — and a persistent chat panel lets the team direct
Claude to update project data (onboarding fields, Figma links, review notes,
stage, preview URLs) using plain language.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **Prisma + Postgres** for data (client/project records, media, chat history)
- **@anthropic-ai/sdk** (`claude-opus-5`) for the in-app chat/command box, with
  tool-calling so Claude can act on the project, not just talk about it

## Getting started (local dev)

You need a Postgres instance — the quickest is a throwaway Docker container:

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres --name nuweb-db postgres
```

Then:

```bash
npm install
cp .env.example .env
# Fill in .env:
#   NUWEBSTORAGE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nuweb"
#   ANTHROPIC_API_KEY=...  (optionally GOOGLE_PLACES_API_KEY)
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create a project, and
work through its tabs. The right-hand chat panel talks to Claude about that
specific project — the API key must be set for it to respond.

## Deploying to Vercel

The build is already wired for it (`postinstall: prisma generate`,
`vercel-build: prisma db push && next build`). Steps, all in the Vercel
dashboard — no CLI needed:

1. **Import the repo**: [vercel.com/new](https://vercel.com/new) → import
   this GitHub repo. If you're deploying straight from a feature branch
   rather than `main`, set it as the Production Branch under Project
   Settings → Git (or open a PR and merge to `main` first).
2. **Add Postgres**: in the new project, go to the **Storage** tab → Add →
   **Prisma Postgres**, using environment variable prefix `NUWEBSTORAGE`.
   This auto-populates `NUWEBSTORAGE_DATABASE_URL` (a plain `postgresql://`
   string) plus `NUWEBSTORAGE_PRISMA_DATABASE_URL` and
   `NUWEBSTORAGE_POSTGRES_URL` (unused — the former is an Accelerate-only
   `prisma+postgres://` URL, not usable by the plain Prisma Client this app
   uses). Nothing else to configure. (If you use a different prefix, or a
   different storage provider with different variable names, update the
   `env(...)` name in `prisma/schema.prisma` to match before deploying.)
3. **Add secrets**: Project Settings → Environment Variables → add
   `ANTHROPIC_API_KEY` (required for chat) and `GOOGLE_PLACES_API_KEY`
   (optional, only needed if you don't set a per-project `apiKeyRef` env var
   name instead).
4. **Deploy** (or redeploy, if step 2/3 happened after the first build).
5. If the build doesn't pick up `vercel-build` automatically, override the
   Build Command in Project Settings → Build & Development Settings to:
   `npx prisma db push --skip-generate && next build`.

**Known limitation:** uploaded media (logo/favicon gallery) is written to
local disk (`public/uploads`), which doesn't persist on Vercel's serverless
functions — uploads will fail or vanish in production. Swapping that route
to Vercel Blob (or S3) is the natural fix; ask if you want that wired up.

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
