# Teralur

**Transparansi Proyek Publik** — bantu warga memeriksa informasi papan proyek terhadap
catatan pengadaan resmi yang tersedia, dengan sumber dan batas data yang jelas.

The application uses English URL paths and API field names; user-facing copy remains in
Bahasa Indonesia. The current UI supports manual board entry. Automated vision extraction
is intentionally disabled until a provider is selected; uploaded photos are reduced in the
browser, validated by `/api/extract`, and never stored.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind + Supabase Postgres. Package manager: npm.

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a random `IP_HASH_SALT`.
   Keep `.env.local` private; never expose the service-role key in a `NEXT_PUBLIC_*` variable.
4. Apply the SQL files in `supabase/migrations/` in filename order using the Supabase SQL editor.
5. Import the official OCDS data into `records` before expecting matching or search results.
   No source dump or verified example cases are included in this repository.
6. Run `npm run dev`, then open http://localhost:3000.

Until the database is configured, matching, search, and reports return explicit setup errors.
`GET /api/ping` is an operational smoke check, not a product API endpoint.

## Product routes

Pages: `/`, `/check`, `/dossiers/[slug]`, `/evidence/[slug]`, `/search`, `/examples`,
`/examples/[exampleId]`, `/methodology`, and `/about`.

API: `POST /api/extract`, `POST /api/match`, `GET /api/search`, `POST /api/dossiers`,
`GET`/`PATCH /api/dossiers/[slug]`, and `POST /api/visit-reports`.

The canonical route and payload definitions are in section 7.5 of `docs/PRD.md`.

## Tests and checks

```bash
npm test
npm run lint
npx tsc --noEmit
```

Unit tests cover matching, normalization, progress-ring math, and labels.

## Data and configuration status

- `src/config/match.ts` is **PM-only**: matching thresholds and weights change only through
  the PM.
- `npm run import:records` is not implemented yet. Raw OCDS source files are not present in
  `data/`; obtain and review the licensed source data before populating the database.
- `data/contoh/` contains no verified public examples. The app does not fabricate examples.
- Automated vision extraction remains disabled until a model provider is selected and
  configured. The manual form is available now.
- User photos are never stored or committed. Client-side canvas conversion removes image
  metadata before any upload; the API only validates the submitted bytes.
- No user accounts are used. Rate-limit identifiers are salted hashes.
- Configure `NEXT_PUBLIC_CORRECTION_EMAIL` before launch to publish the correction contact.
