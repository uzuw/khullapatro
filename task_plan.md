# Khulla Patro task plan

## Goal and current phase

Implement the user's simple Khulla Patro with Nepali calendar events, daily rashifal, and independent Nepal gold/silver history. The subsequent 2026-10-13 implementation request supersedes the earlier planning-only instruction and specifies Next.js, NextAuth, Tailwind, Framer Motion, next/font, Zod, security headers, next/image, Playwright, ESLint, Prettier, actual Obsidian UI components and beautiful dithered art.

Current phase: local MVP implemented and verified; source published at https://github.com/uzuw/khullapatro on the public main branch. Evidence is recorded in docs/verification.md. The user has now authorized production deployment to Vercel.

## Completed planning stages

- [x] Establish exactly three sections and exclusions.
- [x] Investigate public shipped Hamro Patro artifacts with REA, retaining partial Evidence/limits.
- [x] Identify dated calendar/rashifal bootstrap and independent federation quotes/history.
- [x] Honor the user's planning-only correction, stop/remove the early scaffold, preserve evidence.
- [x] Write AGENTS, requirements, architecture, contracts, staged plan and research notes.
- [x] Update authorization and architectural decision after the later implementation request.

## Implementation

- [x] Next.js App Router and pinned modern stack; original three-page shell.
- [x] Validated calendar source, correct BS/AD mapping, tithi/holidays and every event.
- [x] Month/year navigation, Today, selected-day detail and responsive grid.
- [x] Twelve full daily rashifal readings with actual source date.
- [x] Independent per-tola gold/silver quotes and real historical dashboard/table.
- [x] Bounded fetches, in-flight deduplication, atomic snapshots and honest stale/unavailable states.
- [x] Actual MIT Obsidian UI button/tabs and license attribution.
- [x] Manrope/Devanagari next/font, original Bayer-dither art through next/image.
- [x] Optional NextAuth GitHub sessions; all core sections public.
- [x] Security headers, same-origin redirects, upstream text rendering.
- [x] Type checking, ESLint, 22 unit tests and production build pass.
- [x] Repeatable Playwright production interactions, mobile/reduced motion and security/auth checks pass.
- [x] Live source→API→UI comparison, navigation and visual review complete.
- [x] Prettier and final checks; docs reflect verified current state.
- [x] Audit every requested requirement and milestone before marking complete.

## Decisions and limits

Next.js replaces proposed Vite/Fastify at the user's request. Optional GitHub is used for NextAuth; no provider credentials are supplied, so external OAuth completion remains untested. Persistent normalized files suit one local instance; public hosting/storage/reuse terms remain separate decisions. Test-only source/clock preload isolates browser fixtures on port 3002; normal application on 3001 reads public sources and validated runtime snapshots.

The user has authorized creation and publication of the public `uzuw/khullapatro` repository after readiness checks. REA semantic analysis is partial following worker heap exhaustion; no private backend recovery is claimed.

## Next action

The reviewed README, screenshots, MIT-licensed implementation, tests, and documentation are published as `uzuw/khullapatro`. Public repository publication is complete. Local MVP remains ready at http://localhost:3001; optional external OAuth needs provider credentials.

## Branding update

The user requested Khulla Patro throughout the application and a concise README. The GitHub repository is renamed to uzuw/khullapatro; visible branding, metadata, package identity, docs, cache configuration, and screenshot previews have been updated and verified. Detailed setup is in docs/development.md. The verified rename is complete and ready for user review at http://localhost:3001; publication to main is authorized.

## Vercel deployment

- [x] Confirm user authorization and target GitHub repository.
- [x] Inspect integrated Vercel identity and default team.
- [x] Obtain access to uzuws-projects through the authenticated same-scope CLI fallback.
- [x] Add shared persistent snapshot support and deployment exclusions.
- [x] Verify build, source failures, real private snapshot persistence/reload, and 11 browser interactions.
- [ ] Link the Git repository, configure storage/environment, and deploy production.
- [ ] Verify deployed source/API/UI and record the actual URL and commit.
