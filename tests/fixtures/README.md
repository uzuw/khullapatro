These fixtures contain minimized public response fields observed on 2026-10-13.
Calendar event titles, date mappings, and benchmark quotes are retained for adapter verification.
Rashifal predictions are replaced with a clearly synthetic test sentence; this tests schema and date handling without redistributing readings.
Fixtures are consumed only by tests and never provide production fallback data.

Sources: https://www.hamropatro.com/, https://www.hamropatro.com/rashifal,
https://api.fenegosida.org/api/website/v1/Dashboard/today,
https://api.fenegosida.org/api/website/v1/Dashboard/WeeklyChartRate?weekmonthyear=365.

The browser-history fixture retains ten actual per-tola observations captured on 2026-10-13, spanning January to October, so 7/30/365-day controls produce different periods and gaps remain visible.

Calendar boundary/year-transition fixtures retain the selected public month grids captured on 2026-10-13, minimized to the adapter contract. They validate selectors and bounded navigation; they do not imply exhaustive year-range coverage.
