# Teralur

**Transparansi Proyek Publik** — photograph a public-project signboard; Teralur extracts its
fields, matches them against official procurement records, and shows an evidence dossier.

This repository is the Day-0 starter: scaffold, config, database migration, pure matching
logic with tests, and a smoke-test route. No product features yet.

## Stack

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (Base UI) · Supabase Postgres ·
deployed on Vercel. Package manager: npm.

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values. Never commit `.env.local`
   and never print or log secret values.
3. `npm run dev`, then open http://localhost:3000
4. Smoke test: `GET /api/ping` reports which env vars are present (booleans only), whether
   the `records` table is reachable (row count), and the model status (`"skipped"` for now).

## Tests

```bash
npm test
```

Pure logic only: normalization, trigram similarity, matching, progress ring, labels.

## Import & evaluation

- `npm run import:records` — stub (owner: BE). Will import raw procurement data from
  `data/raw/` into the Supabase `records` table.
- `npm run eval:gold` — reads `data/gold.csv` and prints a table (evaluation stub).

## Database

The schema lives in `supabase/migrations/0001_init.sql`. It is run by the PM in the Supabase
SQL editor (not automatically). RLS is enabled on every table with no policies on purpose:
only the server (service role key) may access data.

## PRD

See `docs/PRD.md`.

## Ground rules

- `src/config/match.ts` is **PM-only**: matching thresholds and weights change only through
  the PM. Nothing else in the codebase may hardcode those values.
- User photos are **never stored or committed**: nothing writes photos to disk or to the
  database, and `data/foto/`, `data/raw/`, and `*.heic` are git-ignored.
- No authentication and no user accounts in this starter.
