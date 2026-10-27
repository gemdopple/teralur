# Teralur

Teralur helps people explore public infrastructure projects and compare
information from project signboards with available procurement records. The
interface is primarily in Bahasa Indonesia, and explains the sources and limits
of the data it presents.

## Features

- Browse projects, maps, search results, dossiers, and supporting evidence.
- Compare manually entered signboard details against procurement records.
- Provide an administrator area for managing projects, resources, QR codes, and
  community visit reports.
- Manage contractor accounts (created by an administrator) and assign each
  project to a single contractor. A contractor sees only the projects assigned
  to it.
- Optionally extract signboard details from a photo using a compatible vision
  model. Photo processing is disabled by default and uploaded photos are
  processed in memory, not stored by the application.

## Roles and project assignment

Each account has a role stored server-side in the `profiles` table, resolved on
every request by `src/lib/identitas.ts`. The role is not taken from a cookie, so
it cannot be changed from the browser.

- **Pemerintah (government)** assigns projects and picks a contractor. It sees
  every project in its working area.
- **Kontraktor (contractor)** accounts are created by an administrator in the
  admin console (email and starting password). A contractor's dashboard and its
  API are filtered by `submissions.contractor_id`, so it only ever sees the
  projects assigned to it — including when opening a project board by URL.
- **Admin** manages site content: projects, resources, QR codes, reports, and
  contractor accounts.

One project is assigned to at most one contractor. The supplier name recorded on
the official project data (`penyedia`) is separate and is still used when
comparing signboard data against procurement records.

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4
- Supabase Auth and Postgres
- Vitest and ESLint

## Prerequisites

- Node.js compatible with the versions required by Next.js 16
- npm
- A Supabase project for database-backed features

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template to a local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Fill in the values described below. Keep local environment files private;
   they are not intended to be committed.

3. Apply the SQL migrations in `supabase/migrations/` to your Supabase project,
   in filename order. Migration `0005_contractors.sql` is required for
   contractor accounts: it adds the `contractors` and `profiles` tables (the
   server-side source of each account's role) and `submissions.contractor_id`
   (the single-contractor assignment).

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

The public pages can start without a connected database, but search, matching,
project administration, and reports need the relevant Supabase configuration
and data. The application returns setup errors when required services are not
configured.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Server-side Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service-role key for privileged database operations. Never expose this as a `NEXT_PUBLIC_*` variable. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL used by the browser authentication client. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/publishable key used by the browser authentication client. |
| `IP_HASH_SALT` | Secret salt for rate-limit identifiers; required for rate-limited endpoints when the database is configured. |
| `MODEL_API_KEY` | Optional API key for automatic photo extraction. Without it, users can enter signboard details manually. |
| `MODEL_BASE_URL` | Optional OpenAI-compatible API base URL. Defaults to `https://api.openai.com/v1`. |
| `MODEL_NAME` | Model identifier for the configured vision provider. |
| `NEXT_PUBLIC_SITE_URL` | Public site origin used to generate project and QR-code links. |
| `NEXT_PUBLIC_CORRECTION_EMAIL` | Optional public email address for corrections. |
| `ADMIN_EMAILS` | Comma-separated allowlist of administrator email addresses. Accounts listed here are treated as `admin` even without a `profiles` row. |
| `PHOTO_FLOW_ENABLED` | Set to `true` to enable the otherwise disabled photo workflow. |

The variables included in `.env.example` are the main application settings.
`MODEL_BASE_URL` and `MODEL_NAME` are optional provider-specific settings.

For command-line scripts that use `tsx --env-file=.env`, also create a private
`.env` file from `.env.example` and fill in the server-side values they need.

## Application routes

### Public pages

- `/` — home
- `/jelajah` — browse projects
- `/search` — search
- `/dossiers/[slug]` and `/evidence/[slug]` — project dossiers and evidence
- `/examples` and `/examples/[exampleId]` — examples
- `/methodology` and `/about` — methodology and project information
- `/check` — signboard checking; the photo/checking workflow is disabled unless
  `PHOTO_FLOW_ENABLED=true`
- `/pindai` — QR scanning

### Dashboard and administration

- `/login` — sign in
- `/dashboard` — project dashboard, reports, map, and settings
- `/admin` — administrator project management
- `/admin/login` — administrator sign in

### API

Route handlers are under `src/app/api/`. They include endpoints for searching,
matching, dossiers, photo extraction, visit reports, and administrator
management of projects and resources.

## Database and sample data

Apply migrations in `supabase/migrations/` before using database-backed
features. The demo seed script inserts fictional demonstration projects:

```bash
npm run seed:demo
```

It uses `.env` and requires `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`.

`npm run import:records` imports procurement records from
`data/raw/main_tangerang.csv` and `data/raw/awards_tangerang.csv`. These source
files are not included in the repository; obtain and review authorized source
data before running the importer.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve a production build. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run the Vitest suite. |
| `npm run create:admin` | Create or configure an administrator using the local script. |
| `npm run seed:demo` | Seed fictional demo projects into Supabase. |
| `npm run import:records` | Import local procurement CSV files into Supabase. |

## Privacy and security notes

- Never commit `.env`, `.env.local`, or real credentials.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side.
- Photo extraction requires explicit model configuration; photos are not
  persisted by the application.
- Demo projects are fictional. Do not present them as real procurement records.
