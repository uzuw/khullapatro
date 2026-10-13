# OpenPatro: calendar and rashifal source research

This document preserves the initial public-source investigation and proposed acceptance criteria. The local application has since been implemented; see [verification](verification.md) for current results.

## Evidence and scope

Observed on 2026-10-13 through unauthenticated HTTPS GET requests using Node's native `fetch`, with a 15-second request timeout. No account, private endpoint, privileged request, or source repository was used. The investigation inspected returned HTML and shipped JavaScript. It did not establish the upstream database implementation or independently verify astronomical calculations.

Retained evidence:

| Artifact                        | SHA-256                                                            | What it supports                                                     |
| ------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `evidence/hamropatro/home.html` | `df7e32461d9463a32c6259fd1b3f0a54fe182296c933bd32fa3ca460ffdcb155` | Home bootstrap, current source date, three month grids, event arrays |
| `evidence/hamropatro/site.js`   | `d2082c5e4c30d5568d2d54a8b9b3fae841c18b3688715c8d7448d0be2c821498` | Shipped client route construction and calendar interactions          |

The retained home bootstrap has `renderedAt: 1791871552065`, corresponding to `2026-10-13T06:05:52.065Z`. Hashes bind these exact downloaded artifacts, not every future response from the same URL.

Additional live checks began at `2026-10-13T06:14:17.039Z`. Their exact response digests were recorded in terminal output; their raw HTML was not separately retained:

| Public path         | HTTP / bootstrap page  | Response SHA-256                                                   |
| ------------------- | ---------------------- | ------------------------------------------------------------------ |
| `/rashifal`         | 200 / `rashifal-index` | `503e982f24143dbc22189d61f18339a49499fe41ba9ea39e20d5837448fb083d` |
| `/calendar/2000/1`  | 200 / `calendar-month` | `36d42329e4442f0c30b23c102af33a3130fcab5f4ccf185c4f1870ac7365c8d4` |
| `/calendar/2100/12` | 200 / `calendar-month` | `75d952e9c90d26515d4b74feb94b6dba36cadfd2bfec950bf454de05862548b3` |
| `/calendar/1999/1`  | 404 / `not-found`      | `0d54b7b0668cc013d07b31c08dd1be81338e8fe6c96e56fabc97d200a277cef1` |
| `/calendar/2101/1`  | 404 / `not-found`      | `b51a97c39861d3f72910c0e7e02f0734e1c5c7d918353b14714aae71ea4c38b6` |

## Public data delivery

The useful data is already embedded as JSON inside `<script id="hp-bootstrap">…</script>` in the returned HTML. JSON can be parsed directly; running the shipped JavaScript is unnecessary for these fields. This is an observed web rendering contract, not an identified documented API.

The bootstrap top-level keys include `path`, `renderPath`, `locale`, `page`, `renderedAt`, `today`, `sidebar`, `data`, and `head`. OpenPatro would only need selected fields from `today` and `data`.

Observed routes:

- [Home](https://www.hamropatro.com/) supplies the current month and its adjacent months.
- [Calendar month example](https://www.hamropatro.com/calendar/2083/7) supplies the selected month and its adjacent months.
- [Daily rashifal](https://www.hamropatro.com/rashifal) supplies all twelve signs in one response.

The shipped client constructs `/calendar/{yearBs}/{monthBs}` links and day-selection links with `?d={yearBs}-{monthBs}-{dayBs}`. These are public page routes. No separate backend calendar API was established by this investigation.

## Calendar schema and event completeness

`data.calendar.initialMonths` is an array of month objects. The retained home has months 2083/5 (Bhadra), 2083/6 (Ashwin), and 2083/7 (Kartik). `initialIndex` is 1 and `initialSelectedDayBs` is 27 in that response.

Each month includes:

```text
yearBs, monthBs, monthNameNp, monthNameEn, yearBsNp,
daysInMonth, weekdayHeaders[{np,en}], days[], todayKey,
prev{year,month}, next{year,month}
```

Each day includes both date systems:

```text
year_ad, month_ad, day_ad, year_bs, month_bs, day_bs,
dayOfWeek, inMonth, dayBsNp, dayAdNp, isToday,
isWeekendHoliday, isHoliday, daysRemaining,
tithiShort, tithiShifted, panchanga, patroEvent, userEvents
```

`dayOfWeek` uses Sunday = 0 through Saturday = 6. The `days` array is a complete display grid, including adjacent-month dates marked `inMonth: false`. Observed grids have 35 or 42 cells. The selected month contains `daysInMonth` actual dates; the grid cell count is not the month length.

`patroEvent` is either null or an object containing:

```text
items[{titleNp,titleEn,isHoliday}], isHoliday,
titleNp, titleEn, image, articleUrlNp, articleUrlEn
```

The `items` array is the important event contract. Some dates in the retained home contain six separate events. Preserve every item and its holiday flag; the combined `titleNp`/`titleEn` strings are presentation conveniences. A compact calendar cell may abbreviate presentation, but a selected-date view must expose the full event list. `panchanga` is already supplied by the source, although displaying its extra details is outside the requested MVP scope.

“All events” can mean all items returned by this source for the selected date. These observations do not establish that Hamro Patro covers every local, religious, or government event, or that every event is correct. Empty source arrays cannot prove that no event exists elsewhere.

Observed month navigation crosses year boundaries: the January-equivalent BS month 1 has `prev: {year: previousYear, month: 12}`; month 12 has `next: {year: nextYear, month: 1}`.

## Observed year boundary

The page for 2000/1 returned a valid 30-day selected month in a 35-cell grid; the page for 2100/12 returned a valid 31-day selected month in a 35-cell grid. Requests for 1999/1 and 2101/1 returned 404. Additional sampled requests for 1970/1, 1974/1, 1975/1, 2190/1, and 2199/1 also returned 404; 2100/1 returned 200.

An initial supported selection range of 2000–2100 BS inclusive is therefore a reasonable inference. Every intervening year/month was not checked, and this is not a contractual source guarantee.

There is a useful qualification: the successful 2000/1 bootstrap includes an adjacent grid for 1999/12, and the successful 2100/12 bootstrap includes 2101/1. Embedded neighboring data can exist even when a direct out-of-range page is unavailable. Do not infer unrestricted route support from those adjacent objects. Disable navigation beyond the chosen range unless more evidence establishes support.

## Daily rashifal schema

The `/rashifal` bootstrap has:

```text
page: "rashifal-index"
data.period: "daily"
data.rashifal: {
  date: <Nepali source date label>,
  signs: [{slug,np,en,emoji,initials,descNp,descEn}]
}
```

The observed response contains exactly these twelve unique slugs, in this order:

| Slug     | Nepali  | English     |
| -------- | ------- | ----------- |
| mesh     | मेष     | Aries       |
| brish    | वृष     | Taurus      |
| mithun   | मिथुन   | Gemini      |
| karkat   | कर्कट   | Cancer      |
| singha   | सिंह    | Leo         |
| kanya    | कन्या   | Virgo       |
| tula     | तुला    | Libra       |
| brischik | वृश्चिक | Scorpio     |
| dhanu    | धनु     | Sagittarius |
| makar    | मकर     | Capricorn   |
| kumbha   | कुम्भ   | Aquarius    |
| meen     | मीन     | Pisces      |

Every observed sign has a nonempty Nepali prediction in `descNp`; `descEn` is an empty string for all twelve. The MVP can display complete Nepali text without inventing translations. `initials` supplies the traditional name syllables; `emoji` supplies a zodiac symbol.

The response labels the predictions `२७ आश्विन  २०८३ मंगलवार`. Its top-level `today.adKey` is `2026-10-13`, matching the source's BS date 2083/6/27. This confirms the date attached to the observed content; it does not prove future publication timing or an independent editorial update timestamp. No prediction text is reproduced here.

## Time, freshness, and proposed adapter contract

The source `today` object supplies `year_ad`, `month_ad`, `date_ad`, `year_bs`, `month_bs`, `date_bs`, `adKey`, formatted date labels, weekday labels, and month names. The retained home describes Tuesday 13 October 2026 as असोज २७, २०८३.

The live rashifal response was fetched around `06:14:17Z`, while its `renderedAt` was `2026-10-13T06:09:58.455Z`. Thus a successful HTTP request does not imply that the HTML was rendered at request time. `renderedAt` is a rendering timestamp and must not be relabeled as the prediction's publication time.

The canonical proposed OpenPatro response shapes are in [data-contracts.md](data-contracts.md). They deliberately normalize the raw fields above and distinguish `sourceRenderedAt`, content date, `fetchedAt`, and `checkedAt`. Source observations in this document should not be treated as an alternate product API.

Suggested behavior is a short server cache, bounded request timeout, and a persisted last-known successful snapshot. Retain source date and actual fetch timestamp. After a live failure, label saved content explicitly and preserve its old date. With no usable snapshot, return an unavailable state rather than synthesized calendar events or predictions. Calendar fallback must match the requested BS month.

Compute the current wall-clock date in `Asia/Kathmandu`; do not reuse embedded `isToday` or `daysRemaining` from an old snapshot. Compare the source's AD date with the current Nepal date. Revalidate across Nepal midnight, and distinguish cached fetched content from today's content if the upstream source has not updated. An independent AD↔BS converter has not been selected or verified in this research.

## Constraints and unknowns

The HTML bootstrap and its field names are undocumented and may change without notice. Network availability, source caching, request limits, historical event coverage, and month-page completeness across the entire inferred range remain unverified. HTML access working in native server-side `fetch` does not establish browser CORS permission. A future server adapter should validate its trust boundary and avoid evaluating upstream scripts or injecting upstream HTML.

The source's calendar and horoscope reuse license, redistribution permission, and terms applying to this extraction were not established. Public accessibility and the possibility of an open-source OpenPatro implementation do not establish an open license for upstream text or data. Attribution should remain visible; publication decisions require the actual applicable terms or a separately licensed data source. This is an unresolved research item, not a finding that reuse is forbidden.

## Proposed acceptance criteria for a later build

- A current and an explicitly selected BS month render from genuine source dates, with the correct weekday positions and both BS and AD numbers.
- Month/year rollover works within the verified selection range; invalid, fractional, incomplete, or out-of-range request parameters fail before fetching.
- Every returned `patroEvent.items` entry appears in the selected-date detail, including dates with multiple events; holiday and tithi fields survive parsing.
- Calendar fixtures verify actual month length, unique dates, ordered in-month day numbers, valid AD dates, and consistency between `inMonth` and the selected month.
- Rashifal validates daily period, dated content, exactly twelve unique recognized signs, and nonempty source predictions; empty English predictions remain explicitly unavailable.
- Malformed or missing bootstrap JSON, wrong requested month, invalid dates, duplicate signs, source HTTP failure, and timeout produce a useful failure or a clearly dated matching snapshot.
- A restart retains the last successful snapshot. A stale snapshot never acquires a new fetch timestamp or an invented source date merely because it was read.
- Tests around Nepal midnight verify that highlighting and rashifal freshness follow Nepal's current date rather than the user's device timezone or saved `isToday`.
- Manual verification checks the calendar and predictions against the same dated source page. Such verification checks fidelity to the source, not independent astronomical or editorial correctness.
