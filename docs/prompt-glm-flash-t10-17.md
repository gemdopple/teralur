# Prompt: Clear Tasks T-10 → T-17 (Teralur)

Copy everything below the line into the agent as its first message.

---

You are working in the **Teralur** repo (`G:\Coding\hackathon`, Windows, Git Bash). Teralur is a mobile-first web app (Bahasa Indonesia, no login) where a citizen photographs a public-works project signboard, confirms the extracted fields, and the app matches them against official procurement records, producing a "dossier" with status, time ring, labels, and source trail.

Your mission: **finish tasks T-10 through T-17 from the PRD to their "Selesai jika" (done-when) criteria, without breaking existing behavior.** Work only on the current branch (`Task10-17`). Never touch `master`.

## 0. Read first (mandatory, before writing any code)

1. `AGENTS.md` — this repo runs a **newer Next.js than you were trained on**. Before writing or modifying any app code, read the relevant guide in `node_modules/next/dist/docs/`. Do not rely on remembered Next.js APIs; verify against the installed docs.
2. `docs/PRD.md` — the single source of truth. Read at minimum: §5 (F-01…F-05 acceptance criteria), §6 (business rules: fields 6.1, normalization 6.2, scoring 6.3, status 6.4, ring 6.5, labels 6.6, vocabulary 6.7), §7 (architecture 7.1, schema 7.3, vision prompt 7.4, **route catalog 7.5**, security 7.7), §10.2 (task rows H2 and H3–4), §8.4 (standard UI texts).
3. Existing code — do **not** rewrite what exists. Extend and fill gaps only.

## 1. Stack and commands

- Next.js (App Router) + TypeScript + Tailwind 4 + zod 4 + Vitest + Supabase Postgres (`pg_trgm`).
- `npm test` (unit tests), `npm run lint`, `npm run build`.
- DB scripts (require `.env`, which already exists — **never print or commit it**): `npm run eval:match-smoke`, `npm run eval:gold`, `npm run import:records`.
- Supabase project is already linked (`supabase/.temp/`). Known gotcha already fixed: trigram RPCs need `set search_path = public, extensions` (see `supabase/migrations/0002_api_functions.sql`). Keep that pattern.

## 2. Current state (verified) — do not redo these

| Task | Already in repo | Remaining gap (your job) |
| --- | --- | --- |
| T-10 | `src/lib/match/` (match, normalisasi, trigram + tests); `scripts/eval-match-smoke.ts` (runs live, committed); `src/config/match.ts` thresholds | `scripts/eval-gold.ts` is a **stub** (only parses CSV). `data/gold.csv` is header-only. Result table for 12 boards not produced |
| T-11 | nothing | No G-02 entry in PRD §13.3 |
| T-12 | `supabase/migrations/0001_init.sql` (records/submissions/kunjungan/pembatasan, RLS, GIN trigram indexes) and `0002_api_functions.sql` (similarity, rate-limit, candidate RPCs) | Verify migrations run from zero; fix if they don't |
| T-13 | `/check` page + `ApiBoardForm` with client-side resize (1600 px, JPEG q0.8, ≤4 MB, `capture="environment"`, canvas re-encode drops EXIF); photo POSTs to `/api/extract` | **No photo preview** shown to the user. "Kerangka dossier dengan data contoh": `data/contoh/` is empty and `/examples` pages are placeholders |
| T-14 | `/api/extract` complete for the interim state: magic-byte type check, 4 MB cap, multipart guard, rate limit (10/h/IP), `maxDuration=30`, returns **503 `MODEL_NOT_CONFIGURED`** when no provider key (this is the PRD §7.4 interim contract — keep it); `src/lib/vision.ts` has the real model call + zod parse + 1 retry, gated on `MODEL_API_KEY` | Route never calls `extractPapan` even when a key IS set — wire the success path `{ board, unreadFields }`. Client ignores a successful response (no prefill). No 504 timeout path |
| T-15 | Confirmation form: all 10 fields, 2-of-3 key-field gate, disabled submit, money input strips non-digits | KP F-03 gaps: null fields are **not highlighted yellow**; the disabled/submit message is generic instead of **naming the missing key fields**; no prefill of extraction results; `unreadFields` not marked |
| T-16 | `/api/match` (zod, 422 when <2 key fields, statuses, slug creation, candidates persisted) and `/api/search` (q + year, max 10, empty-state text in `SearchForm`) | Verify against KP F-04/F-10; confirm tie handling (two candidates within 0.05 → user chooses) works end-to-end; measure search ≤2 s |
| T-17 | `/dossiers/[slug]` loads via `getDossier`, renders `DossierView` (status chip, papan-vs-catatan table, selisih note, Cincin, PanelJejak, candidates, visit counts); `PATCH /api/dossiers/[slug]` + `CandidateSelector` exist | Verify full display per §7.5 contract; ensure candidate switch recalculates status and persists; verify 404 and `official_record` (from search) paths |

Environment facts: `MODEL_API_KEY` is **not** set. That is intentional (PRD §7.4: until the provider is chosen, extract returns 503 and the manual form is the path). **Do not invent a provider, do not fake a key, do not mock the model in the route.** Real gold-set photos are human field work that the team has explicitly deferred (see comment atop `eval-match-smoke.ts`) — **do not fabricate field results.**

## 3. Task instructions (execute in this order)

### T-12 — verify schema runs from zero (do this first, it unblocks everything)
- Run `npx supabase db reset` (needs Docker). If Docker is unavailable, run `npx supabase db push --dry-run` against the linked project and state which check you could not perform.
- Acceptance: reset from an empty database succeeds, all four tables + RLS + both GIN indexes + all RPCs exist. If it fails, fix the migrations (idempotent, no data loss for already-applied remote).
- Commit: `fix(db): ...` only if changes were needed; otherwise no commit.

### T-10 — finish the gold-set evaluation
- Replace the stub in `scripts/eval-gold.ts` so it: reads `data/gold.csv` (columns per PRD §11.1), runs `match()` for every row against candidates fetched via the same RPC the API uses (`find_record_candidates`), and prints a **results table per board**: expected vs got status, top candidate, whether `id_catatan_resmi` (when present) was found, plus summary: % boards that found a record (Cocok or Selisih), precision of top candidate, and per-field availability.
- Graceful behavior when `gold.csv` has zero data rows: print a clear message and exit 0 with an interim note (do not crash, do not invent rows).
- Run `npm run eval:gold`. With the CSV empty, the honest output is "gold set belum terisi (lapangan ditunda); hasil interim dari eval-match-smoke". Also run `npm run eval:match-smoke` and save its stdout to `docs/t10-results.md` as the interim results table, clearly headed "INTERIM — synthetic boards, real records; final table awaits field gold set".
- Acceptance (PRD): a results table for the gold set exists at `docs/t10-results.md`; `npm run eval:gold` runs without error; unit tests still pass.
- Commit: `feat(eval): implement gold-set evaluation for T-10` + `docs: interim T-10 results from smoke eval`.

### T-11 — record the G-02 decision in writing
- Append one row to the decision log table in `docs/PRD.md` §13.3, following the existing style (see the G-01 "pralulus" precedent). Content: G-02 decided **provisionally** on the evidence available (smoke eval on real records: state the actual numbers from `docs/t10-results.md` — boards found, top-candidate precision); final decision deferred until the field gold set (12 boards) exists; if the final numbers miss the gate (≥4/12 found, ≥90% precision), the fallback per §10.3 is "Cari Paket becomes the primary flow".
- Do not modify any other PRD section.
- Acceptance: the entry exists, is dated 2026-10-21, names PM as decision maker, and cites the interim numbers.
- Commit: `docs(prd): record provisional G-02 decision for T-11`.

### T-16 — verify matching + search endpoints against KP F-04 / F-10
- KP F-04: response status is always exactly one of `matched` / `discrepancy` / `not_found` (§7.5 enum); the gold-set test runs with **one command** (`npm run eval:gold`); two candidates scoring within 0.05 surface as a user choice (`requiresSelection`) — verify by code trace and add a Vitest case for the tie case if one is missing.
- KP F-10: `/api/search?q=...` returns ≤10 results; empty result shows exactly "Tidak ditemukan di data yang kami miliki. Coba kata kunci lain." (§8.4). Measure latency with 5 real queries via `curl` against `npm run dev` (or a script) and record p95 in `docs/t10-results.md`; target ≤2 s.
- Fix whatever fails. Do not change threshold values in `src/config/match.ts` — if the evidence suggests tuning, write the proposal in your final report instead (PM-owned per §10.4).
- Commit (if fixes): `fix(api): ...` per fix.

### T-14 — complete the extract endpoint's provider path (no key present, so keep interim behavior)
- In `/api/extract`, after validation + rate limit: if `MODEL_API_KEY` is set, call `extractPapan` with a **20 s app-level timeout** (deadline already inside `vision.ts`; enforce with `AbortSignal.timeout`/Promise.race so the route returns **504 `MODEL_TIMEOUT`** on expiry), map field names to the §7.5 camelCase API board, respond `{ board, unreadFields }`. If the key is absent, keep today's 503 `MODEL_NOT_CONFIGURED` response byte-for-byte.
- Add Vitest unit tests for the mapping and for the timeout branch using an injected fake fetch (do not test against a real provider).
- Acceptance: with no key set, behavior is unchanged (503 `MODEL_NOT_CONFIGURED`); code path with key is unit-tested; `maxDuration` stays 30; secrets never appear in any response or client bundle (`vision.ts` stays server-only).
- Commit: `feat(api): wire provider path and 504 timeout for /api/extract (T-14)`.

### T-15 — confirmation form to full KP F-03
- Yellow highlight (token `#FFC400` border/background tint) on any key field that is null/empty while the 2-of-3 gate is unmet — per PRD "field null tampil kuning".
- The disabled state must explain itself: below the button show a message **naming the missing key fields**, e.g. "Belum lengkap: penyedia, nilai kontrak. Isi minimal 2 dari 3 field kunci." (exact field names in Indonesian: nama paket, penyedia, nilai kontrak).
- Money input: accept "Rp 1.234.567", "1234567", and "1234567,00"-style input, normalizing to an integer; keep the digit-stripping behavior but do not corrupt values mid-typing.
- Prefill: when `/api/extract` succeeds with `{ board, unreadFields }`, populate the form with `board` and mark fields listed in `unreadFields` with the same yellow highlight and the §8.4 texts. (Testable now only via a unit-level check or by temporarily faking the fetch in a test — do NOT permanently mock the API in the UI code.)
- Acceptance: every KP F-03 bullet demonstrably met (state how you verified each in the report).
- Commit: `feat(ui): confirmation form meets KP F-03 (T-15)`.

### T-13 — upload preview + dossier skeleton with example data
- Photo preview: after the user picks a photo and it is resized client-side, show the resized image preview (object URL, revoke on replace) with its dimensions and final byte size, plus the standing note that photos are never stored. Works on a 360 px viewport.
- Dossier skeleton with example data: create a small static dataset — `src/data/examples.ts` (typed, 2–3 example dossiers: one Cocok, one Selisih, one Tidak ditemukan; values must be **invented but plausible and clearly non-accusatory**, names of suppliers like "PT Contoh Konstruksi" so nothing real is implicated) — and wire `/examples` and `/examples/[exampleId]` to render `DossierView` purely from that static data (works offline, no API). `exampleId` is the static ID, not a dossier slug (§7.6).
- Acceptance (PRD): "Foto terkirim ke endpoint tiruan" is already true (it posts to the real endpoint) — keep it; preview visible; `/examples/[id]` renders a full dossier skeleton with no network calls.
- Commit: `feat(ui): photo preview on /check (T-13)` and `feat(ui): static example dossiers for /examples (T-13)`.

### T-17 — dossier fully wired to the API
- End-to-end check against the §7.5 contract: POST `/api/match` (or `/api/dossiers` with `recordId` for the search-origin path) → follow the returned slug → dossier renders chip status, papan-vs-catatan summary, discrepancy display with both values side by side (§6.4) and the "Perbedaan sering wajar…" note, Cincin, source trail, candidate list.
- Candidate switch: using `CandidateSelector` → `PATCH /api/dossiers/[slug]` must recalculate status server-side and the page must reflect the new selection after refresh. Verify the 422 path (candidate not part of dossier) returns the documented error.
- Verify 404 for unknown slug and the `official_record` status chip ("Catatan resmi", neutral) for search-originated dossiers.
- Where a check fails, fix it. Labels beyond what already exists are explicitly **out of scope** ("label menyusul" per the task row).
- Commit (if fixes): `fix(dossier): ...` per fix.

## 4. Hard rules

- **Vocabulary (PRD §6.7):** the words korupsi, markup, fiktif, curang, penipuan, bermasalah, gelap, terlambat, molor, mangkrak, hilang, disembunyikan must never appear in user-visible text. Use the sanctioned phrases from §6.4/§8.4.
- **Language split:** API field names and enum values are English camelCase (§7.5); every piece of UI text is Bahasa Indonesia.
- **Privacy/security:** no photo storage; EXIF already stripped by canvas re-encode — keep it that way. Keys only in server env. RLS stays enabled. Client never touches the DB directly.
- **Scope fence:** do not build F-06…F-14 features beyond what T-10…T-17 need (ring/label/visit components already exist — reuse, don't extend). Do not touch: evidence card generation (T-25), methodology content (T-26), demo mode (T-28), pitch material.
- **Thresholds:** `src/config/match.ts` values are PM-frozen. Propose changes in the report only.
- **Commits:** small, conventional (`feat:`, `fix:`, `test:`, `docs:`), one logical change each, on `Task10-17`. Never commit `.env`, `supabase/.temp/`, or secrets. Do not push unless told.
- **If blocked** (Docker missing, env var absent, test cannot pass for an environmental reason): record it, do the maximal safe alternative, and continue — do not hack around safety rules or fake results.

## 5. Definition of done — final report

After all tasks, run `npm test`, `npm run lint`, `npm run build` and the two eval scripts. Then output a report with:

1. A table: task → status (Selesai / Selesai bersyarat / Terblokir) → evidence (file, command output snippet, or manual check performed).
2. For each KP of F-01…F-05 touched: how it was verified (exact method).
3. The interim T-10 numbers and the provisional G-02 conclusion.
4. Anything left for humans (field gold set photos, real model key, threshold tuning proposals).
5. Full list of commits made.

Do not claim a task is done unless its "Selesai jika" criterion from PRD §10.2 is demonstrably met; say "Selesai bersyarat" when it depends on deferred human inputs, and say precisely which input.
