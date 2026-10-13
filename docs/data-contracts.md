# Data contracts

Implemented in `src/lib/contracts.ts` and the three Next.js route handlers. Upstream field names remain in the source research; components consume these normalized contracts.

## Shared response metadata

Every successful response contains `schemaVersion: 1`, `data`, and `meta`:

| Field                       | Meaning                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `meta.source` / `sourceUrl` | Human-readable provider and public supporting page                     |
| `meta.nepalDate`            | Current wall-clock date in Asia/Kathmandu, recomputed for the response |
| `meta.sourceDate`           | Date attached to daily source content; null if not established         |
| `meta.sourceRenderedAt`     | Source HTML rendering timestamp if provided, otherwise null            |
| `meta.fetchedAt`            | Last successful retrieval of the data being returned, ISO UTC instant  |
| `meta.checkedAt`            | Last refresh attempt, ISO UTC instant                                  |
| `meta.status`               | `fresh` or `stale` for usable data                                     |
| `meta.servedFrom`           | `upstream`, `memory`, or `snapshot`                                    |
| `meta.warnings`             | Stable codes and short messages describing degradation                 |

`servedFrom: memory` does not imply stale: an unexpired cache is usable fresh data. A successful response does not imply the daily source content is current. Compare its content date with `nepalDate`. Calendar month data is not stale merely because the requested month is historical; its retrieval interval and refresh failures determine that status.

No successful retrieval timestamp is advanced when reading a snapshot. No source publication date is inferred from an HTTP response timestamp. Unknown facts remain null.

## Calendar

`GET /api/calendar` requests the source's current BS month. `GET /api/calendar?year=2083&month=6` requests one explicit BS month.

Both query parameters must be supplied together, as complete integers. Month must be 1–12. Initial year-selection bounds are 2000–2100 inclusive, based on sampled source responses; do not claim exhaustive coverage. A month must still be successfully validated on receipt.

`data`:

```text
{
  yearBs: number,
  monthBs: number,
  monthNameNp: string,
  monthNameEn: string,
  daysInMonth: number,
  supportedYears: {min: number, max: number},
  days: CalendarDay[]
}

CalendarDay = {
  bs: {year: number, month: number, day: number},
  ad: "YYYY-MM-DD",
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  inMonth: boolean,
  tithi: string | null,
  tithiShifted: boolean,
  isWeekendHoliday: boolean,
  isHoliday: boolean,
  events: [{titleNp: string, titleEn: string | null, isHoliday: boolean}]
}
```

The grid includes adjacent-month dates. An adjacent date may be displayed even when its own month is outside the configured selectable range; display does not authorize out-of-range fetching. Do not expose upstream `userEvents` or carry source `isToday`/`daysRemaining` as authoritative values. The UI derives Today from `ad === meta.nepalDate`.

Validation invariants:

- Requested year/month match the selected payload exactly.
- In-month BS days are unique and contiguous 1 through `daysInMonth`.
- AD dates are real, ordered, and unique; weekday matches the AD date.
- `inMonth` agrees with BS year/month, and source grid weekday columns align.
- Events preserve every supplied item; malformed items fail validation instead of disappearing silently.
- Text is plain text, with bounded payload size. Omit unrelated upstream metadata.

When calling the parameterless route near midnight, verify the source current month against `nepalDate`. If cached source Today is old and the grid has the current AD date in an adjacent month, select/fetch that actual mapped month. If no mapping is available, return a dated stale state or unavailable state; do not invent a BS conversion.

## Daily rashifal

`GET /api/rashifal` has no period or date parameter in the MVP.

```text
data = {
  period: "daily",
  readingDateAd: "YYYY-MM-DD" | null,
  readingDateLabelNp: string,
  signs: [{
    slug: string,
    nameNp: string,
    nameEn: string,
    symbol: string,
    textNp: string,
    textEn: string | null
  }]
}
```

Recognized sign identifiers: `mesh`, `brish`, `mithun`, `karkat`, `singha`, `kanya`, `tula`, `brischik`, `dhanu`, `makar`, `kumbha`, `meen`.

Exactly twelve unique recognized signs and nonempty Nepali readings are required. The observed source's English descriptions are empty: normalize them to null. Never manufacture translations or predictions.

The source date label is primary reading-date evidence. The bootstrap's Today supplies useful paired AD context, but a parser must check agreement and avoid equating a rendering timestamp with the reading's publication date. If a future label cannot be mapped confidently, `readingDateAd` remains null and current-day freshness is not claimed. A mismatched or unverified date receives a visible warning.

## Metals

`GET /api/metals` returns a validated Nepal benchmark quote and at most the requested source's yearly history. Metal and period filtering can happen locally; no more API routes are needed for the MVP.

```text
data = {
  currency: "NPR",
  unit: "tola",
  goldPurity: "fine/hallmark",
  quote: {
    date: "YYYY-MM-DD",
    gold: number | null,
    silver: number | null
  } | null,
  previousQuote: {
    date: "YYYY-MM-DD",
    gold: number | null,
    silver: number | null
  } | null,
  history: [{date: "YYYY-MM-DD", gold: number | null, silver: number | null}],
  historyMeta: {
    sourceUrl: string,
    fetchedAt: string | null,
    status: "fresh" | "stale" | "unavailable",
    startDate: "YYYY-MM-DD" | null,
    endDate: "YYYY-MM-DD" | null
  }
}
```

A current quote can be usable even with no history, and dated history can be usable without a current bulletin. `meta.status` describes quote availability/freshness when a quote exists; `historyMeta` independently describes the series. `meta.warnings` must explain when only history is available or one metal is missing. A historical point cannot silently masquerade as a freshly published quote.

Prices must be finite and positive. Reject ambiguous metal/purity/unit matches. The upstream property name is not evidence of its unit: use the row's rate type and verify it against the federation page. The source includes per-10-gram rows that must not be mixed into the per-tola series.

Deduplicate and sort observations by real source date. Merge a newer current quote into a matching dated history record while retaining valid values for the other metal; preserve source provenance for revisions. Do not forward-fill, interpolate, invent missing days, or treat a zero as a real published price. A nullable metal is unavailable, not zero.

Current quote comparisons use the previous available published record for that metal, with its date disclosed. A chart period uses calendar days ending at the latest available historical date, not the last N rows. Display those actual period bounds. Its first and last valid records determine period change; fewer than two means change is unavailable. Min/max summarize available values only. Retain valid decimal precision; formatting must not silently round source values to whole rupees.

## HTTP behavior

| Case                                             | Response                 |
| ------------------------------------------------ | ------------------------ |
| Valid data or usable stale snapshot              | 200 with status metadata |
| Invalid or incomplete parameters                 | 400 `INVALID_REQUEST`    |
| Valid selected month unsupported by upstream     | 404 `MONTH_UNAVAILABLE`  |
| Source failure/schema change and no usable data  | 502 `SOURCE_UNAVAILABLE` |
| Source timeout and no usable data                | 504 `SOURCE_TIMEOUT`     |
| Local rate limiting, if public hosting is chosen | 429 `RATE_LIMITED`       |

Errors use `{error:{code,message,retryable}}`; messages should help the user recover and avoid leaking upstream bodies or internals. A provider 429 is a source-availability failure with backoff; it is distinct from OpenPatro limiting its own client.

Use read-only GET routes. API response freshness is controlled through the server metadata/cache rules, initially with `Cache-Control: no-store` at the browser boundary. Default to same-origin access. Never accept an arbitrary upstream URL from a client.
