# Nepal gold and silver: source research and proposed design

This document preserves the initial source investigation and implementation proposal. The local adapter, storage, and dashboard have since been implemented; see [verification](verification.md) for current results.

## Recommended source

Use [FENEGOSIDA](https://www.fenegosida.org/), the Federation of Nepal Gold and Silver Dealers' Association, as the primary Nepal benchmark source. Its public website exposes both current and historical rates. There is no need to obtain metals data through Hamro Patro.

The intended products are hallmark/fine gold (`छापावाल सुन`) and silver (`असली चाँदी`), quoted in NPR per tola. Global spot prices and exchange-rate conversions should not be substituted for these Nepal benchmark rates.

## Observed endpoints and response shapes

Read-only inspection on 2026-10-13 found these calls in the federation's shipped JavaScript bundle, `https://www.fenegosida.org/assets/index-BKOvvj1h.js`:

- [Current rates](https://api.fenegosida.org/api/website/v1/Dashboard/today).
- [Historical chart series](https://api.fenegosida.org/api/website/v1/Dashboard/WeeklyChartRate?weekmonthyear=365).
- [Date-specific history](https://api.fenegosida.org/api/website/v1/Dashboard/datewisehistory?date=2026-10-13).
- [Monthly daily history](https://api.fenegosida.org/api/website/v1/Dashboard/monthwisehistory?date=2026-10-01).
- Period summaries: `/api/website/v1/Dashboard/ratehistory?weekMonthYear=week:2026-10-13`, with `month:YYYY-MM-DD` also present in the shipped history component.

The current and historical-chart endpoints were fetched successfully without authentication. The date-specific, monthly, and period-summary routes were observed in client code but their valid-parameter responses were not examined. A request using an unsupported `weekMonthYear=1` value returned HTTP 500; that does not establish behavior for a valid parameter.

The current endpoint returns an array of rows. This abbreviated real response preserves the observed field names and values:

```json
[
  {
    "id": 16128,
    "todayDate": "2026-10-13T04:55:39.936+00:00",
    "yestardayDate": "2026-10-12T05:01:01.531+00:00",
    "rateType": "छापावाल सुन (१ तोला)",
    "todayBaseRatePerGram": 292200.0,
    "yestardayBaseRatePerGram": 294400.0
  },
  {
    "id": 16130,
    "todayDate": "2026-10-13T04:55:39.936+00:00",
    "yestardayDate": "2026-10-12T05:01:01.531+00:00",
    "rateType": "असली चाँदी दर (१ तोला)",
    "todayBaseRatePerGram": 4355.0,
    "yestardayBaseRatePerGram": 4415.0
  }
]
```

Other rows in that same response quoted ten grams: gold NPR 250,515 and silver NPR 3,734. Despite the value field name `todayBaseRatePerGram`, the actual unit comes from `rateType`. A parser must select `तोला` and the intended metal/purity before interpreting the number. The misspelled `yestarday...` keys are present in the observed response.

The historical-chart endpoint returns an object with `goldData`, `silverData`, `goldInternationalRate`, `silverInternationalRate`, and `americanDollarTodayRate` arrays. Each gold/silver entry has this shape:

```json
{
  "date": "13",
  "year": "2026",
  "month": "Oct",
  "day": "Tuesday",
  "gm": 250515.0,
  "tola": 292200.0
}
```

For silver on the same date, `gm` was `3734.00` and `tola` was `4355.00`. Comparison against the current endpoint establishes that the historical `gm` value represents the separately quoted ten-gram amount in this response, rather than one gram. The proposed MVP should use only `tola`, avoiding this field-name ambiguity. The international and USD arrays contained zero values in the inspected yearly response; those arrays are not usable evidence of live international prices.

The shipped `Graph-B55b6kJ0.js` passes numeric values `7`, `30`, and `365` for weekly, monthly, and yearly graph controls. An observed live request with `365` returned 366 dated gold and silver entries spanning 2025-10-13 through 2026-10-13 inclusive. The earliest entries were gold NPR 240,400/tola and silver NPR 3,220/tola; the latest agreed with the current quote. Requests using `weekmonthyear=month` returned only one day's data, so the parameter should remain numeric as observed in the official client.

Evidence identities for the files inspected in this pass:

| Artifact                       | SHA-256                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| Main shipped JavaScript bundle | `3a7bdcff1272a4498709aecb885687c3e197ca0b61a5b5c1b6e0004d46a42392` |
| Raw yearly-chart JSON response | `185be6203e64e006a43a4979b89f9a1b6b65000f3f4d81769dea01bdf387797f` |

These were direct read-only HTTP and shipped-client observations. No REA Evidence ID was generated for this metals-source investigation. They establish public response content and client API usage, not the federation's internal calculation method. Future responses or website releases will have different identities.

A normalized research snapshot is retained at `evidence/snapshots/metals-history.json`. It contains the 366 observed dated gold/silver rows, the source URL, units, and collection timestamp. This is investigation evidence, not a proposed production fallback or a claim that these dated observations are current on a later visit. Its normalized-file digest differs from the raw-response digest above.

## Proposed adapter and freshness semantics

Use a small server-side adapter with native HTTP fetch and bounded timeouts. Coalesce simultaneous refreshes so opening the dashboard does not multiply upstream requests. The canonical cache defaults are in [architecture.md](architecture.md): quotes refresh at 15 minutes, history at 6 hours, and degraded requests receive a short backoff.

The canonical proposed normalized response is in [data-contracts.md](data-contracts.md). Keep the dated published `quote` distinct from `history`, preserve `previousQuote`, and track history freshness independently. Historical statistics belong to the selected UI period rather than an alternate source-specific API contract.

Convert source publication timestamps to calendar dates in `Asia/Kathmandu`. Derive historical dates from the separate `year`, `month`, and `date` fields and validate real Gregorian dates. Require positive finite prices, an unambiguous per-tola product match, and compatible gold/silver dates. Do not assume every response applies to the day it was fetched.

Always show the publication date (`quote.date`) on price cards. `fetchedAt` records successful data retrieval; `checkedAt` records the latest refresh attempt. Current quotes and history have independent freshness: a current quote can succeed while the chart is unavailable, and a saved chart can remain useful if visibly dated. If all requests fail, show the last previously validated published quote as stale. If only history exists, identify it as historical data rather than calling its final point a newly published quote. With no validated cached data, show prices as unavailable rather than zero or invented examples.

For the proposed current-card status, `fresh` means successfully retrieved, validated data dated to today in Nepal. An older source date, or a fallback after failed retrieval, means `stale`, even if the HTTP request itself completed recently. A failure does not change an older record's quote date.

Merge current and prior published quote records by source date into the historical series. Price cards use the dated published quote and compare it with the previous available quote. Preserve the comparison date; a missing day makes “previous available quote” more accurate than “yesterday.” If the endpoints disagree for the same date, prefer the current-rate endpoint and record a diagnostic; disagreement handling should be explicit.

The MVP chart should offer 7-, 30-, and 365-day windows. Calculate range movement and period min/max from the selected real observations. Missing or zero observations should remain missing, without interpolation or fabricated points. Repeated upstream values may be retained, but an upstream chart point alone does not establish that a new bulletin was issued that day. Display source attribution and the history's retrieval date. These are descriptive market patterns; a predictive forecasting feature is outside the requested scope.

## Historical alternatives and permission boundaries

The primary source already provided the full one-year chart required for this MVP. A broader secondary dataset exists at [binayabaral/nepal-market-data](https://github.com/binayabaral/nepal-market-data), with [an MIT license](https://github.com/binayabaral/nepal-market-data/blob/main/LICENSE). Its precious-metal CSVs state NPR per tola; its backfill script combines historical GitHub records and NotifyNepal data, while its daily scraper calls the same current FENEGOSIDA endpoint. Its 22K gold series is calculated from 24K using a fineness multiplier. This is supplementary research, not an approved replacement source, and the primary-source one-year history avoids that extra provenance chain for the MVP.

Public unauthenticated availability is observed; an explicit FENEGOSIDA API or data-redistribution license was not established from the inspected page, client assets, or response content. Authentication requirements, commercial-use permission, allowed scraping frequency, redistribution terms, rate limits, retention restrictions, and guaranteed service availability remain unknown. A third-party repository's software license does not by itself establish permission for the original federation's underlying data. Keep source attribution, limit requests, and resolve the intended redistribution/hosting terms before shipping a publicly redistributed historical dataset. No permission or license grant is inferred here.

No lower-level authentication, private member operations, or access-control bypass is needed for the observed rates. Published benchmarks alone do not establish a shop's final transaction price or its making charges and other costs.

## Proposed acceptance checks

1. The source's ten-gram gold row cannot be selected as the tola quote; duplicate/ambiguous product matches fail clearly.
2. Source publication dates are preserved across holidays, fetch failures, restarts, and midnight in Nepal; an older quote is never relabeled as today's.
3. Real invalid dates, negative prices, non-finite values, and zero observations cannot become chart points or market statistics.
4. Independently failing current/history endpoints produce the right visible freshness state. With no validated data, both cards show unavailable.
5. Concurrent refreshes share a request, source timeouts are bounded, and failure retries do not cause repeated upstream traffic on every render.
6. On a live verification day, both per-tola cards and the latest chart points agree with the official source; the date, units, and source link remain visible.
7. Change calculations show the preceding available quote's date, and selected-period statistics use that same selected period's real observations.
8. Before public distribution, document the resolved source/API/data permissions and chosen cache/retention policy. No checked-in rate snapshot is required during this planning phase.
