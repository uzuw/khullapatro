# Vercel deployment

The user authorized production deployment on the `uzuws-projects` team. The project is `khullapatro`, linked to [uzuw/khullapatro](https://github.com/uzuw/khullapatro), with Node.js 22 and functions in Mumbai (`bom1`). The public production site is **[khullapatro.vercel.app](https://khullapatro.vercel.app)**. GitHub main deploys automatically. Application commit `77341ce` passed live source comparisons at 2026-10-14T05:13:03.828Z; later documentation commits retain the same application code.

## Storage

A private Vercel Blob store, `khullapatro-snapshots`, is connected to this project. Only validated normalized source data is persisted; raw investigation assets and test snapshots are not uploaded as product fallback. Production and nonproduction paths are separate. Reads request the latest object; conditional writes preserve newer concurrent data.

Local development defaults to files in `.cache/KhullaPatro`. `KHULLAPATRO_CACHE_STORAGE` accepts `file` or `blob`; an empty value selects files locally and Blob on Vercel. `KHULLAPATRO_CACHE_DIR` applies only to file storage.

Blob credentials (`BLOB_STORE_ID` with Vercel OIDC, or `BLOB_READ_WRITE_TOKEN`) stay server-only. Connecting the store supplies credentials; never commit environment files. `.vercel/`, `.env.local`, caches, build output, and raw evidence are excluded from Git and deployment uploads.

Storage remains subject to the [Vercel Blob Hobby limits](https://vercel.com/docs/vercel-blob/usage-and-pricing). Exceeding the free allowance can make snapshot storage unavailable; the app warns when a refresh cannot be saved and shows unavailable content when neither a valid snapshot nor the source is reachable. Refresh is request-driven, with no scheduled jobs. Deduplication/backoff are per instance, not a global traffic lock.

## Authentication

Production has its own sensitive `AUTH_SECRET`. Core pages remain public and GitHub login is disabled until provider credentials are configured. `AUTH_URL` is configured as `https://khullapatro.vercel.app`. For GitHub login, add provider credentials and register `https://khullapatro.vercel.app/api/auth/callback/github`. Real GitHub OAuth completion remains unverified.

## Release checks

Build, typecheck, lint, unit tests, fixture-based production browser tests, and formatting must pass. After deployment, verify all three pages and APIs against actual sources, private snapshot persistence, date labels, responsive layout, and public accessibility. A local pass is not proof of deployed source access.

The integrated connector rejected the default team with HTTP 403. The same-scope CLI fallback was authenticated through Vercel's device flow and confirmed access; no credentials were copied into source files.

## Verified production behavior

All three pages and APIs are publicly accessible on the production domain; generated and team deployment URLs retain Vercel protection. Source comparisons match the current calendar (2083/6, 35 cells, 72 event items), twelve readings dated 2026-10-14, Nepal gold/silver rates (289,500 and 4,255 NPR/tola), and 366 historical observations. Sampled months 2000/1, 2100/12, 2083/12, and 2084/1 match source dates/events/tithi, including the year transition. These are point-in-time checks, not exhaustive coverage.

Real private snapshots persisted and reloaded after clearing process memory. A concurrent first-writer race was corrected: identical content saved by another request counts as available fallback, while its actual retrieval timestamp is retained. Production metals now returns no persistence warning.

Live browser checks selected the six-event date, changed Aries to Pisces, changed the metals chart/table to Silver and 7D, and confirmed the mobile calendar fits a 360px viewport (345px content). Auth session and CSRF endpoints return 200; external GitHub OAuth remains unconfigured.

Hamro calendar pages can redirect to an English-prefixed route on Vercel. Requests prefer Nepali and permit one same-origin slash or observed `/en/calendar/<same year>/<same month>` redirect within the original timeout. Login paths, challenge queries, other origins, and redirect chains remain rejected. Direct source comparisons pass after this change.
