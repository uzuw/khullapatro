# Vercel deployment

The user authorized production deployment on the `uzuws-projects` team. The project is `khullapatro`, linked to [uzuw/khullapatro](https://github.com/uzuw/khullapatro), with Node.js 22 and functions in Mumbai (`bom1`). Deployment and public URL verification are in progress.

## Storage

A private Vercel Blob store, `khullapatro-snapshots`, is connected to this project. Only validated normalized source data is persisted; raw investigation assets and test snapshots are not uploaded as product fallback. Production and nonproduction paths are separate. Reads request the latest object; conditional writes preserve newer concurrent data.

Local development defaults to files in `.cache/KhullaPatro`. `KHULLAPATRO_CACHE_STORAGE` accepts `file` or `blob`; an empty value selects files locally and Blob on Vercel. `KHULLAPATRO_CACHE_DIR` applies only to file storage.

Blob credentials (`BLOB_STORE_ID` with Vercel OIDC, or `BLOB_READ_WRITE_TOKEN`) stay server-only. Connecting the store supplies credentials; never commit environment files. `.vercel/`, `.env.local`, caches, build output, and raw evidence are excluded from Git and deployment uploads.

Storage remains subject to the [Vercel Blob Hobby limits](https://vercel.com/docs/vercel-blob/usage-and-pricing). Exceeding the free allowance can make snapshot storage unavailable; the app warns when a refresh cannot be saved and shows unavailable content when neither a valid snapshot nor the source is reachable. Refresh is request-driven, with no scheduled jobs. Deduplication/backoff are per instance, not a global traffic lock.

## Authentication

Production has its own sensitive `AUTH_SECRET`. Core pages remain public and GitHub login is disabled until provider credentials are configured. For GitHub login, set `AUTH_URL` to the actual production origin and register `/api/auth/callback/github` there. Real GitHub OAuth completion remains unverified.

## Release checks

Build, typecheck, lint, unit tests, fixture-based production browser tests, and formatting must pass. After deployment, verify all three pages and APIs against actual sources, private snapshot persistence, date labels, responsive layout, and public accessibility. A local pass is not proof of deployed source access.

The integrated connector rejected the default team with HTTP 403. The same-scope CLI fallback was authenticated through Vercel's device flow and confirmed access; no credentials were copied into source files.
