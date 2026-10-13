# Product requirements

Status: implemented locally after the user authorized the Next.js stack on 2026-10-13. Acceptance evidence is in [verification.md](verification.md).

## Objective

Give one person a readable Nepali calendar and the two additional sections they actually want. Fast access to dates and their events is the primary job. The three core sections remain public. Optional NextAuth GitHub sign-in was subsequently requested as part of the stack; no personalization database is added.

## Calendar: first working milestone

The default view opens the current BS month. It shows a Sunday-first seven-column grid, BS day numbers, smaller AD dates, Saturday styling, source holiday marks, available tithi, and event labels attached to each date. Month and year controls allow valid supported selection, with previous/next and a Today action.

Selecting a date shows its full Nepali and AD date, weekday, tithi, and **every** event returned for that date. Long multi-event dates may show a compact preview in the grid, but the full list must remain visible in the detail view. Each event retains its source holiday flag and regional/community qualifications. Empty event lists say “No events listed” instead of asserting that no event exists.

Today follows Nepal time regardless of the device timezone. Month lengths and AD↔BS associations come from actual source records. An independent date-conversion algorithm is not required for this MVP.

Acceptance:

- Current and selected months agree with dated source fixtures: weekday placement, actual month length, BS/AD associations, events, tithi, and holidays.
- No event item is dropped, including a fixture containing six events on one date.
- Month 12→1 and 1→12 cross years correctly; navigation respects validated source selection bounds.
- Historical snapshots highlight Today from AD date comparison, never from stored `isToday`.
- Keyboard users can choose a date and read its full events; the grid and detail remain usable at a 360-pixel viewport.
- Failure, empty data, saved data, and loading states are clear and recoverable.

“All events” means all event items supplied by the selected source for that date. Coverage of every Nepal-specific event is not independently established.

## Rashifal

A dedicated section lists twelve signs with Nepali names and English sign names. Choosing a sign shows the complete daily source text and its attached date. Remembering the selected sign on the same device is an optional small convenience, not a user account.

Acceptance:

- Twelve recognized unique signs are available from one validated daily response.
- Source text and source date are preserved. Empty English text is not translated or fabricated.
- A previous-day reading stays labeled with its actual date; it is not presented as today's after midnight or a network failure.
- Missing signs or malformed readings do not silently replace a complete valid saved response.

The MVP supports daily readings only. No generated readings, birth-chart calculations, or weekly/monthly/yearly forecasts.

## Gold and silver

A dedicated market section shows fine/hallmark gold and silver in **NPR per tola**, the actual quote date, previous available quote comparison, and source attribution. Use FENEGOSIDA directly, independently of Hamro Patro.

Our own dashboard offers a gold/silver selector and 7-, 30-, and 365-day historical periods. It shows a chart, period change, observed minimum/maximum, and a dated price table. A seven-observation moving average may be included only as a clearly labeled historical summary when enough observations exist; it is not needed to pass the MVP gate.

Acceptance:

- Values match source rows selected by metal, purity, and unit. A misleading upstream property name must not cause per-tola values to be shown as per-gram.
- Current cards distinguish quote date from fetch time. Older saved quotes never receive a “today” label.
- Period calculations use real available records within calendar-day bounds, with no invented or interpolated gap values.
- If a new quote is newer than chart history, merge it using its actual source date and disclose that older history was saved if appropriate.
- Gold and silver have independently meaningful scales; changing metal or period changes chart, table, and summary together.
- An accessible table communicates the same prices as the visual chart.
- A one-record period displays its price and reports change as unavailable, rather than suggesting a measured zero change.

“Market pattern” means observed price movement and historical summaries. It does not mean trading recommendations or a predictive model.

## Shared quality requirements

- Separate sections load and fail independently.
- Source attribution links, quote/reading dates, and freshness labels are visible without exposing implementation jargon.
- Interface copy is concise; Nepali text is readable. English navigation with Nepali content is the initial design choice, open to later user adjustment.
- Keyboard focus is visible, controls are named, colors are not the sole event/status indicator, and reduced motion is respected.
- No upstream JavaScript execution, raw HTML injection, or browser-to-source API dependency.
- A last-known valid snapshot survives a backend restart and is clearly identified when used after failure.
- No fabrication is used to make loading screens look populated.

## Explicit exclusions

News, weather, forex, ads, remittance, payments, health services, radio, podcasts, mandatory accounts, social features, subscriptions, personal-event editing, notifications, exports, global spot-price conversion, detailed panchanga, generated astrology, and price forecasts.

## Open decisions

Personal/local MVP is the assumed first target. Public hosting, repository license, content redistribution terms, and an independent event dataset need separate decisions before public release. They do not require expanding the product scope.
