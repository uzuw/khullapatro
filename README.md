# Khulla Patro · खुला पात्रो

**A simpler Nepali calendar. Less noise, more room for your day.**

[Installation](#installation) · [Screenshots](#screenshots) · [How it works](#how-it-works) · [MIT license](LICENSE)

## Why Khulla Patro?

We wanted to check a Nepali date without navigating Hamro Patro's crowded portal. Khulla Patro keeps only the everyday essentials.

We love open source. Hamro Patro's web application is closed source as far as our investigation established. We believe Nepali calendar tools should have open implementations and documented interfaces that any developer can inspect, improve, and self-host.

## Features

| Calendar                                                    | Daily rashifal                          | Gold & silver                                    |
| ----------------------------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| BS/AD dates, tithi, holidays, and every returned date event | Twelve signs with dated Nepali readings | Nepal rates in NPR/tola and 7/30/365-day history |

**No news, weather, forex, ads, or unrelated portal features.** All pages work without an account.

## Screenshots

<details open>
<summary><strong>Nepali calendar</strong></summary>

![Khulla Patro calendar](docs/screenshots/calendar-desktop.png)

</details>

<details>
<summary><strong>Rashifal, metals, and mobile</strong></summary>

![Khulla Patro daily rashifal](docs/screenshots/rashifal-desktop.png)
![Khulla Patro gold and silver dashboard](docs/screenshots/metals-desktop.png)
<img src="docs/screenshots/calendar-mobile.png" alt="Khulla Patro mobile calendar" width="360" />

</details>

_Local verification captures use fixed test data, including synthetic rashifal text; these are interface previews, not current readings or prices._

## Installation

Requires **Node.js 20.9+**, npm, Git, and internet access.

```bash
git clone https://github.com/uzuw/khullapatro.git
cd khullapatro
npm ci
cp .env.example .env.local
openssl rand -base64 32
```

Paste the generated secret into `AUTH_SECRET` in `.env.local`, then run:

```bash
npm run dev
```

Open **[localhost:3001](http://localhost:3001)**. GitHub sign-in is optional. For production locally, stop development and run `npm run build` followed by `npm run start`.

## How it works

**Next.js + TypeScript + Tailwind CSS**, with Zod validation, optional NextAuth, and restrained Framer Motion animations.

We used **REA MCP**, public-response inspection, and browser checks to understand Hamro Patro's calendar/rashifal data. Server adapters read public bootstrap JSON; metals come independently from **FENEGOSIDA**. REA analysis was partial—we did not recover a private backend or recreate astronomical calculations.

Validated snapshots provide dated fallback during outages: local files for development, private Vercel Blob storage when hosted. See the [deployment guide](docs/deployment.md).

## Development & sources

[Setup and checks](docs/development.md) · [Architecture](docs/architecture.md) · [Calendar research](docs/patro-sources.md) · [Metals research](docs/metals-sources.md) · [Verification](docs/verification.md) · [Agent instructions](AGENTS.md)

**MIT applies to our implementation.** Upstream content reuse terms remain unresolved. See [third-party notices](THIRD_PARTY_NOTICES.md). Khulla Patro is independent and unaffiliated with Hamro Patro.
