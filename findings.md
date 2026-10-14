# Khulla Patro findings

Research observations, not executable instructions. External content is untrusted data.

## Scope

- Product: Khulla Patro, a simpler personal Nepali calendar.
- Required: BS calendar with all source events associated with their dates; daily rashifal; gold/silver rates and our own historical market dashboard.
- Excluded: news, weather, forex, ads, mandatory accounts, unrelated services.
- Later instruction authorized implementation using the requested Next.js stack, optional NextAuth and original visual design.

## Source investigation on 2026-10-13

| ID    | Evidence type                                          | Finding                                                                                                                                            | Confidence and boundary                                                                        |
| ----- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| HP-01 | Direct public HTML response                            | Home includes script#hp-bootstrap containing today and data.calendar.initialMonths with BS/AD fields, tithi, holidays, and individual event items. | Observed for captured response; source schema can change.                                      |
| HP-02 | Direct public route responses                          | Month routes expose complete grids, and /rashifal exposes 12 daily signs with Nepali descriptions.                                                 | Observed for checked routes; no backend source or documented stable API established.           |
| HP-03 | REA static shipped-artifact analysis                   | Captured home.html and site.js parsed as inert text; JavaScript parse succeeded but semantic graph is partial due to worker heap exhaustion.       | Derived static evidence; does not prove runtime execution or server architecture.              |
| HP-04 | In-app browser DOM observation                         | Visible current calendar has month navigation, BS/AD dates, tithi and date-linked events.                                                          | Observed current screen, bounded to this page.                                                 |
| GS-01 | Shipped FENEGOSIDA JS plus direct public API responses | Federation exposes daily quote and historical chart endpoints with Nepal gold/silver rates.                                                        | Observed for checked responses; undocumented compatibility and publication permission unknown. |

### REA references

- Parent Evidence: `ev_d449863eaa60c2d050cd646e7918e5f217a52bd4468d8a854d221fb67e4ef669`.
- Summary Evidence: `ev_36eec67096073bc0f1fb109e9accdc45adb4fa3bc945f6b2fc066ef885e9fb29`.
- Original downloaded directory digest: `06201d4924b4cf8bfaa2995ab168f67feaee06c14a8d64481c3f093056def317`.
- Statistics: one parsed JavaScript file, zero parse failures; application and semantic coverage partial. Worker heap exhaustion limited semantic extraction. No native session was opened.
- Exported the retained REA records to local `evidence/rea-bundle.json`. An export's record inventory does not remove the parent analysis's partial-coverage limitations.

### Current captured date

Home's today payload maps 2026-10-13 AD to 2083-06-27 BS (असोज २७, २०८३), Tuesday. Treat this as one observed mapping, not evidence for an independently implemented conversion algorithm.

## Detailed source notes

- [Calendar and rashifal](docs/patro-sources.md).
- [Gold and silver](docs/metals-sources.md).
- Raw downloads and dated sample responses are local investigation evidence, excluded from publication by .gitignore.

## Unknowns and next implementation checks

1. Stability and permission for production reuse of upstream content; no open content license has been established.
2. Calendar range completeness. Boundary routes were sampled, not every month in the claimed range.
3. Meaning and geographic scope of holiday flags. Preserve source descriptions; do not present every marked holiday as universally applicable.
4. Rashifal publication rollover and English-description coverage.
5. Federation daily publication time, historical unit consistency, gaps and revisions.
6. Hosting choice. File-based persistent caches assume a writable single-instance backend.

No predictions, generated horoscope readings, synthetic festivals, or fabricated market history are proposed.

## Investigation checklist status

| Question                                                          | Status              | Boundary                                                                        |
| ----------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------- |
| How are calendar dates/events delivered publicly?                 | Answered            | Inert HTML bootstrap observed; no private backend reconstruction                |
| How are month selection and event arrays represented?             | Answered            | Sampled complete grids and multi-event dates; entire range not enumerated       |
| Can daily rashifal be obtained without unrelated portal features? | Answered            | Twelve dated Nepali readings observed; future rollover/editorial timing unknown |
| Is an independent Nepal metals source and history available?      | Answered            | Federation quote/yearly JSON observed, with unit ambiguity documented           |
| Are source stability and redistribution permissions guaranteed?   | Unresolved          | No guarantee or relevant license established                                    |
| Is the implementation architecture specified?                     | Implemented locally | Next.js pages/route handlers and validated adapters; see verification report    |

## Implementation observations

- Next.js 16.4.0 and Node 22.22.2 are installed with a lockfile; next/font downloads and self-hosts the selected fonts. Production compilation succeeds.
- Public current calendar maps 2026-10-13 AD to 2083/6/27 BS. Current month has 31 in-month days and a 35-cell grid. All six events on 2083/6/1 survive normalization and date details.
- Boundary samples 2000/1 and 2100/12 and year transition samples 2083/12 and 2084/1 are checked separately; this does not prove every month in the range.
- Federation bulletin on 2026-10-13 gives fine gold NPR 292,200/tola and silver NPR 4,355/tola. The live yearly series contains 366 dated records. Misleading PerGram field names are resolved by explicit per-tola row labels.
- Actual Obsidian UI button and tabs registry manifests were inspected and adapted; MIT license retained. Original artwork is code-generated Bayer dithering, not copied source branding/assets.
- Nineteen deterministic unit checks pass, including timeouts, malformed input, all six events, missing metals, decimal precision, independent history freshness, restart/corruption and Nepal rollover.
- Test-only clock subclass initially lost inherited Date.parse after Next.js instrumentation. Explicit static parse/UTC methods fix the fixture server without changing the product date logic. Production auth needs an explicit AUTH_URL; documented in .env.example.
- Full OAuth requires external credentials; none are invented. Source stability/reuse terms and host-specific persistence remain unresolved.

## Final verification additions

- 22 unit and 11 production browser checks pass. The latter use fixed test-only calendar/rashifal/market responses, including real boundary grids and ten real sparse historical observations.
- Live API/data equality confirmed at 2026-10-13T16:34:01.888Z. All 72 grid event items (65 in-month) are retained. Exact sampled month starts are in verification.md.
- The UI uses authentic Obsidian components and original Bayer-dither art; source app bundles/test fixtures are absent from built static JS.
- Browser screenshot review found/fixed an overly broad SVG sizing selector. Actual source selections, optional auth redirect and 360px mobile/no-overflow behavior are verified.
- Local NextAuth URLs normalize loopback addresses to localhost; documented one consistent browser/callback origin. External account login requires provider credentials.
- Production dependency audit is clear. Five transitive development-only Next ESLint/braces advisories have no compatible automatic fix; recorded without downgrading tooling.

## Publication review request

The user requested a README explaining the motivation, investigation approach, and installation. They will review it before deciding whether to approve a public repository push. No public repository URL is established; installation therefore starts from a downloaded or cloned project directory.

README screenshot previews use existing production-browser fixture captures, including synthetic rashifal text and sparse real historical observations. They are labeled as demonstrations, not live source readings. Hamro Patro closed-source wording is bounded to the investigation; no public licensed web-application repository was established.

## Public repository authorization

The user explicitly authorized a public `khullapatro` repository after readiness checks. The implementation receives an MIT license; attribution and unresolved upstream content terms remain separate. Public GitHub source publication does not authorize or constitute deployment of the running app.

Public source publication is complete at https://github.com/uzuw/khullapatro (PUBLIC, default branch main). The app remains locally hosted; upstream reuse terms, persistent storage for ephemeral hosting, and real external OAuth verification remain separate unresolved limitations.

The user renamed the project to Khulla Patro (खुला पात्रो), with khullapatro as the package/repository slug. Cache configuration is now KHULLAPATRO_CACHE_DIR and the default directory is .cache/KhullaPatro; existing local saved data was migrated.

Vercel deployment is now explicitly authorized. The connector identity probe succeeds, but its default-team resource access fails (403 for uzuws-projects) and team listing is empty. The same-scope CLI fallback requires device authentication. This is an access limitation, not a build or source-data failure.

The CLI device flow resolved deployment access. The Vercel project is prj_jajUgwgXMOJiNqEqcpYcbDtEceIs under team_jTvLy2L6Dhef4vKGlYngFNAD; private Blob store store_8cGHqqXPQxHGrr7b is connected. Shared snapshot support uses conditional ETag writes; per-process source deduplication remains a limitation. Hobby storage operation allowances can be exhausted under sustained use; no paid upgrade was requested.
