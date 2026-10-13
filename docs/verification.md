# Local MVP verification

Verified on 2026-10-13. This report covers the implemented local application, superseding the earlier planning-only handoff. Public deployment and external account setup were not performed.

## Checks run

| Check                            | Result and scope                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`              | Pass: strict TypeScript, all application and test files                                                                                     |
| `npm run lint`                   | Pass: ESLint with Next.js/React rules, no warnings                                                                                          |
| `npm run format:check`           | Pass: Prettier on code, config and docs                                                                                                     |
| `npm test`                       | Pass: 22 focused unit/adapter/cache tests                                                                                                   |
| `npm run build`                  | Pass: Next.js 16.4 production build; all pages/API routes emitted                                                                           |
| `npm run test:e2e`               | Pass: 11 Chromium tests against production build on isolated local ports                                                                    |
| `npm run test:live`              | Pass: direct public-source responses compared with normal local APIs, latest comparison 2026-10-13T16:34:01.888Z                            |
| `npm audit --omit=dev`           | Zero reported production vulnerabilities at verification time                                                                               |
| Source/asset boundary inspection | No upstream bootstrap, upstream API URL or synthetic test reading found in built static JS; evidence and fixtures are never product imports |

Playwright uses minimized source fixtures and a test-only fixed-date preload, separate from the normal app and its cache. Calendar fixtures preserve actual records/events. Horoscope fixture prose is explicitly a synthetic test sentence, never production fallback. Ten actual metals observations span several months, so period changes and chart gaps are meaningfully exercised. Dedicated test caches are reset on test setup. OAuth configuration tests use clearly dummy credentials and stop at the local redirect response without contacting GitHub.

## Requirement audit

| Requirement                                                | Authoritative evidence                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Calendar first and exactly three main sections             | `/`, `/rashifal`, `/metals`; three main navigation links exercised in production browser tests; scope reviewed against requirements                                                                                      |
| Correct source BS/AD mapping, month length and weekdays    | Zod invariants plus fixture checks; live normalized API deeply equals public source records; current month has 31 dates in 35 cells                                                                                      |
| Every event remains accessible                             | Six-event fixture checked against raw records, rendered list has all six titles after keyboard/date selection; live date detail also observed with all six                                                               |
| Tithi, holidays and regional wording                       | Parser fixture checks and date detail preserve source wording/flags; UI explains holiday scope follows source                                                                                                            |
| Previous/next, month/year, Today and range bounds          | Browser test crosses 2083/12↔2084/1, selects 2000/1 and 2100/12, verifies disabled boundary controls and returns to current month                                                                                        |
| Nepal time and dated rollover                              | Date/midnight tests independent of device timezone; actual rashifal adapter refreshes at Nepal midnight while old reading retains date and stale warning; client visibility/refresh handling inspected                   |
| Honest calendar failure and restart                        | Actual calendar adapter timeout/restart test preserves exact matching month, dates and retrieval timestamp; missing alternate-month snapshot fails explicitly; UI failed-navigation/retry exercised                      |
| Twelve full daily readings                                 | Twelve known unique signs validated; all browser selections render complete fixture text; live API deeply equals all twelve complete dated source readings                                                               |
| No invented English or astrology                           | Empty English remains null and is absent from browser; invalid/incomplete source cannot replace a complete dated snapshot                                                                                                |
| Independent Nepal metals source and correct unit           | FENEGOSIDA source/API deeply agree on fine gold 292,200 and silver 4,355 NPR per tola on 2026-10-13; explicit row-label validation rejects ambiguous units                                                               |
| Original market dashboard and genuine history              | 7/30/365-day controls update chart/table/low/high/comparisons; browser uses distinct periods, sparse observation dots and no gap interpolation; live yearly response has 366 records (period counts 7, 30, 365)          |
| Partial prices, decimals, revisions, single-record periods | Parser/domain tests cover zero/missing/negative/decimal amounts, conflicting dates, actual-date reconciliation and unavailable one-record comparison; connected UI reviewed                                              |
| Separate history and quote provenance                      | Actual adapter failure test keeps history's original retrieval time/stale status when a fresh bulletin succeeds; independent quote/history outage tests pass                                                             |
| Bounded validated source fetching/cache                    | 12-second timeout, 5 MB body cap, in-flight coalescing and failure backoff inspected/tested; atomic valid snapshots survive restart and reject corruption                                                                |
| Next.js, NextAuth, Tailwind, Framer Motion and Zod         | Installed/pinned dependencies and working App Router pages/handlers; Zod boundary tests, motion/sign transitions and Tailwind/Obsidian controls rendered                                                                 |
| Optional NextAuth integration                              | Session/CSRF/provider routes checked; configured sign-in button and safe OAuth redirect verified with PKCE S256, HttpOnly cookies, registered local callback and rejected off-origin callback; unconfigured state tested |
| next/font and next/image                                   | Self-hosted font preload requests and loaded original SVG image asserted in browser; readable Manrope/Devanagari and local art visually inspected                                                                        |
| Actual Obsidian UI components                              | Complete button/tabs registry manifests adapted; components used in controls; MIT attribution/license retained in THIRD_PARTY_NOTICES.md                                                                                 |
| Beautiful dither art, balanced grids and navigable pages   | Original Bayer-dither mountain/moon/bullion art; six desktop/mobile screenshots visually inspected, all three routes exercised                                                                                           |
| Smooth restrained motion/reduced motion                    | Short Motion page/sign/nav transitions inspected and exercised; reduced-motion browser tests run on all three pages                                                                                                      |
| Responsive and keyboard behavior                           | 360px production browser tests prove no page overflow, full mobile date details, named controls and keyboard activation; in-app live interactions independently observed                                                 |
| Security headers and safe rendering                        | Production header assertions include CSP/nosniff/DENY and no powered-by header; HSTS/permissions/referrer policy inspected; no source HTML injection or arbitrary upstream proxy                                         |
| ESLint, Prettier and Playwright                            | Configurations, scripts and passing actual runs listed above                                                                                                                                                             |
| Plans and AGENTS maintained                                | README, requirements, architecture, contracts, implementation plan, design, task plan, findings and progress updated to authorized implemented state; retained REA limitations preserved                                 |

## Live source observations

Normal local service comparisons confirmed the current source calendar: 2083/6, 31 in-month dates, 35 grid cells, 72 returned event items including adjacent dates (65 in-month events). Date 2026-10-13 maps to 2083/6/27. All twelve rashifal readings are dated 2026-10-13. The federation gives 292,200 gold and 4,355 silver NPR/tola; 366 yearly records were observed.

Boundary samples agree directly with the source:

| BS month | Days | First in-month AD date |
| -------- | ---- | ---------------------- |
| 2000/1   | 30   | 1943-04-14             |
| 2100/12  | 31   | 2044-03-14             |
| 2083/12  | 30   | 2027-03-15             |
| 2084/1   | 31   | 2027-04-14             |

These are sampled comparisons, not proof of every month/year or independently verified event/astronomical coverage.

## Visual and browser review

Production screenshots at 1365px and 360px were inspected for all three pages. This caught an icon mistakenly inheriting the chart SVG width; CSS now scopes sizing to the actual chart and an icon-size regression assertion passes. Event text and light labels were strengthened; mobile chart labels use readable compact units; monochrome zodiac glyphs fit the original design. Nepali text has language tags. Price-table overflow is contained in its own scrollable wrapper.

The available in-app browser independently showed the live current calendar, the full six-event selected date, real dated rashifal text, gold/silver quotes and a silver/7-day table/chart update. A fresh narrow tab confirmed the seven-column calendar fits without horizontal overflow. Exact 360px dimensions are proven by the authored production Playwright tests; the in-app content width excludes the scrollbar. In-app screenshot capture intermittently timed out; visual review used the repeatable test screenshots, not a claim that those screenshot calls succeeded.

## Material limitations

- No GitHub application credentials were supplied. Local auth routes and outgoing OAuth redirect were tested; external GitHub authorization, callback token exchange and real account session remain untested. Use `localhost` consistently for local OAuth because Next.js normalizes loopback authentication URLs to that hostname. NextAuth v5 is pinned to a beta release.
- Public source contracts are undocumented and content reuse/redistribution terms remain unresolved. The app displays source-provided events/readings; it does not recover Hamro Patro's private backend or guarantee exhaustive calendar/event coverage. REA's semantic analysis remains partial.
- The disk store assumes a writable single instance. Public/ephemeral/multiple-instance hosting needs a storage and reuse decision; no deployment occurred.
- CSP is a same-origin baseline with inline script/style allowances for framework hydration/motion, not a nonce-based strict policy.
- The full npm audit reports five high development-only entries along the Next ESLint→fast-glob→micromatch→braces dependency chain. The available automatic remedy downgrades the Next ESLint configuration to v14; this was not applied to a Next 16 project. Production audit is clean. Recheck tooling advisories before CI/public release.

## Public repository readiness check

Before the authorized public GitHub push on 2026-10-13, the production build, TypeScript, ESLint, Prettier, all 22 unit tests, and all 11 production Chromium tests passed again. Production dependency audit reported zero vulnerabilities. The staged file inventory was checked for local environment secret values, token/private-key patterns, excluded raw evidence/runtime artifacts, and broken README links; no issues were found. MIT applies to the implementation, with third-party component notices and separate upstream content limitations retained. This check does not verify external GitHub OAuth completion or constitute a public application deployment.

## Khulla Patro rename verification

After the branding, package, cache configuration, and documentation rename, the production build, TypeScript, ESLint, formatting, all 22 unit checks, and all 11 production Chromium checks pass. Four README previews were regenerated from the new build. Desktop and 360px mobile calendar screenshots were visually inspected; the longer name fits and all source events remain accessible. The in-app browser could not attach for an additional live inspection; verification here uses the authored Chromium checks and inspected captures.
