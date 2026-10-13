# Implementation plan

**Authorized and implemented locally.** The user subsequently requested the Next.js stack on 2026-10-13. These acceptance gates remain binding; current results are in [verification.md](verification.md).

## Stage 0: Confirm the plan and refresh source evidence (complete)

Deliverable: implementation starts from these agreed product boundaries and up-to-date source observations.

- Read AGENTS.md and the planning files; update the phase only after the user's implementation request.
- Recheck the observed public calendar, rashifal, quote and history schemas. They are undocumented and may have changed.
- Verify runtime and tooling compatibility from official project documentation; pin dependencies in a lockfile.
- Recheck content-reuse terms for the intended personal/public use. Track what is unresolved; public release remains a separate decision.
- Create only the shared server/UI entry points and modules needed for the first calendar milestone.

Exit check: source fixtures and expected normalized contracts are documented, dependency choices are deliberate, and the implementation remains limited to the user-requested scope.

## Stage 1: Calendar MVP (implemented)

Deliverable: locally runnable Khulla Patro with accurate BS calendar and all date events. This is the first working product milestone.

1. Build inert bootstrap extraction and calendar validation against captured, dated source fixtures.
2. Add the calendar route, per-month cache and atomic valid snapshot persistence.
3. Build the responsive month grid, BS/AD dates, tithi, holiday styling and full selected-date event panel.
4. Add month/year selection, previous/next, Today, and Nepal-time rollover.
5. Add clear loading, no-listed-events, unavailable, retry, and saved-data states.

Required checks:

- Same dated source agrees with weekday placement, month length, paired dates and every event item.
- Long/multiple events are all readable in the selected-date detail.
- BS year rollover and sampled selection-range boundaries work; invalid parameters never trigger source fetching.
- Source timeout, wrong month, invalid date, malformed JSON and schema changes preserve a good matching snapshot.
- A restart retains a valid snapshot; a missing/corrupt snapshot shows unavailable without fabricated fallback.
- Nepal-midnight behavior works even on a device configured to another timezone.
- Browser verification covers date selection, navigation, focus, and 360-pixel mobile layout.

Do not move to the next feature while the core calendar is inaccurate or drops events. Record the working milestone and evidence before expanding.

## Stage 2: Daily rashifal (implemented)

Deliverable: a separate daily-rashifal view with complete real readings for twelve signs.

1. Share only the bootstrap parser; add separate sign/date validation and cache key.
2. Add daily-rashifal route and last-good daily snapshot.
3. Build sign chooser, full Nepali text, reading date, attribution, and unavailable/saved states.
4. Revalidate at Nepal midnight and on returning to a hidden tab.

Required checks:

- Exactly twelve known unique signs, each with the same complete text as the dated source.
- Empty English descriptions remain absent; no text is generated.
- Old content retains its date after midnight or upstream failure.
- Incomplete/malformed responses do not overwrite a complete valid snapshot.
- Rashifal failure leaves the calendar usable.

## Stage 3: Independent metals dashboard (implemented)

Deliverable: current Nepal per-tola quotes and an original historical dashboard.

1. Add independently validated FENEGOSIDA quote and history adapters.
2. Verify row labels, purity, per-tola units and source publication timestamps before normalizing numbers.
3. Add separate current/history caches and atomically persist validated dated records.
4. Build current gold/silver rates, quote dates and previous available quote comparisons.
5. Add gold/silver selector, 7/30/365-day chart periods, observed period change and min/max, and an accessible price table.
6. Reconcile current quotes with history without fabricating gaps or changing old-history freshness.

Required checks:

- Quote values and units agree with the independent dated federation source.
- Per-tola rows cannot be mistaken for per-gram/10-gram rows despite misleading upstream field names.
- Duplicate dates, missing values, invalid prices, decimal values, short periods and revised current rows behave deliberately.
- A newly fetched quote with saved history retains separate provenance and freshness states.
- Real gaps remain gaps in the underlying table; chart summaries use only available values.
- Changing metal/period updates every associated chart/table/summary together.
- Source failures and partial metal availability are visible and do not block calendar/rashifal.

No prediction algorithm or buy/sell recommendations are part of this stage.

## Stage 4: Integrated MVP verification (complete locally)

Deliverable: all three requested sections work end to end without unrelated features.

- Run focused parser/date/money/cache tests and the production build.
- Verify source→adapter→API→browser behavior for all three sections.
- Exercise one forced source failure per adapter, expired content, corrupted saved data, and restart persistence.
- Check responsive layouts, keyboard interactions, readability of Nepali text, focus states, and chart table accessibility.
- Verify original UI assets and that no third-party shipped bundle, raw HTML, or investigation snapshot is bundled into the frontend.
- Update README with actual run commands and current implementation limitations only after those commands exist and were verified.
- Keep public deployment and publication outside the local MVP unless subsequently requested.

## Completion definition

The local MVP is complete when the calendar preserves all source date events, daily rashifal is genuinely dated, independent metals data drives real historical summaries, and source failures are handled honestly. Passing fixture tests alone is insufficient; browser interaction and live dated comparisons must also be checked.

## Risk register

| Risk                                                  | Response                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Bootstrap/API changes                                 | Keep adapters isolated; fail validation clearly; preserve last-good data |
| Source content date lags                              | Compare reading/quote dates separately from successful fetch time        |
| Regional holidays mistaken as national                | Preserve qualifiers and describe flags as source-provided                |
| Inferred calendar range has gaps                      | Validate every requested response; disable known unsupported navigation  |
| Metals unit/purity confusion                          | Validate rate-type labels and cross-check source UI                      |
| Market history gaps or revisions                      | Use dated actual records; disclose period coverage and provenance        |
| File caches deployed on ephemeral/multi-instance host | Select persistent storage before that deployment                         |
| Unresolved content reuse license                      | Check applicable terms/source alternatives before public release         |

## Order of technical decisions

Choose correct source data and contracts first, then build the calendar, then add the two independent sections, then integrate. Avoid building generic infrastructure before a real requirement needs it. Estimates and public hosting choices can be added when implementation is requested.

## Requested stack and visual checks

The user's implementation request supersedes Vite/Fastify with Next.js App Router. Verify actual NextAuth route handlers and optional sign-in state, Tailwind styles, restrained Framer Motion transitions/reduced motion, self-hosted next/font typography, Zod validation, delivered security headers, local art through next/image, real Obsidian UI component provenance, Playwright interaction/mobile tests, ESLint, Prettier and production build. No public deployment is authorized. Full external OAuth completion requires the user's provider credentials.
