# Prompt: Clear Tasks T-18 → T-21 (Teralur)

Copy everything below the line into the agent as its first message.

---

You are working in the **Teralur** repo (`G:\Coding\hackathon`, Windows, Git Bash). Teralur is a mobile-first web app (Bahasa Indonesia, no login) where a citizen photographs a public-works project signboard, confirms the extracted fields, and the app matches them against official procurement records, producing a "dossier" with status chip, time ring, three-status labels, source trail, and a citizen visit report.

Your mission: **finish tasks T-18 through T-21 from the PRD to their "Selesai jika" (done-when) criteria, without breaking existing behavior.** Work only on the current branch (`Task18-21`). Never touch `master`.

## 0. Read first (mandatory, before writing any code)

1. `AGENTS.md` — this repo runs a **newer Next.js than you were trained on**. Before writing or modifying any app code, read the relevant guide in `node_modules/next/dist/docs/`. Do not rely on remembered Next.js APIs; verify against the installed docs.
2. `docs/PRD.md` — the single source of truth. Read at minimum: §5 rows **F-06, F-07, F-08, F-12, F-14** (acceptance criteria), §6.5 (ring rules), §6.6 (three labels), §6.7 (vocabulary), §7.3 (kunjungan/pembatasan schema), §7.5 (route catalog: `/api/visit-reports`), §8.2–8.4 (components, colors, standard UI texts), §10.2 rows H5–6.
3. Existing code — do **not** rewrite what exists. Much of T-18…T-21 is already scaffolded; your job is to audit it against every KP bullet, close the gaps, and prove compliance. Extend and fix only.

## 1. Stack and commands

- Next.js (App Router) + TypeScript + Tailwind 4 + zod 4 + Vitest + Supabase Postgres (`pg_trgm`).
- `npm test`, `npm run lint`, `npm run build`, `npm run dev`.
- DB access needs `.env`, which already exists — **never print or commit it**. `npx supabase db reset` needs Docker; if unavailable, verify migrations with `npx supabase db push --dry-run` against the linked project and say what you could not check.

## 2. Current state (verified) — do not redo, audit and close gaps

| Task | Already in repo | Known / likely gaps (verify, then fix) |
| --- | --- | --- |
| T-18 | `src/lib/cincin.ts` (`hitungCincin`, three states, UTC day math) + `cincin.test.ts` covering berjalan/penuh/melewati/tak_terhitung; `src/lib/label.ts` (`labelUntuk`) + `label.test.ts`. Fallback rules §6.5 (total: board → record; start: record → board) implemented at the call site in `DossierView.tsx` (lines ~49–50) | Ring tests exist but the **fallback precedence itself** is not unit-tested as a pure function (it lives inline in the component). `isian` when `total <= 0` returns 0 — decide and test the intent (a non-positive total should surface as `tak_terhitung`, per §6.5 "tidak dapat dihitung"). Label coverage: no test that a **derived** value gets a visible formula (KP F-08 is about display, see T-19) |
| T-19 | `src/components/teralur/`: `Cincin.tsx`, `ChipStatus.tsx`, `LabelTiga.tsx`, `PanelJejak.tsx`, `DossierView.tsx` all exist and render | KP compliance not yet proven per bullet. Verify: F-06 — all three ring states render with data contoh, disclaimer **"Ini waktu yang telah berjalan, bukan kemajuan fisik."** always present, "terlambat"-family words absent, melewati text matches §6.5 including "Addendum atau perpanjangan mungkin ada."; F-07 — **every row** in the dossier (and later the evidence card, out of scope here) carries exactly one label badge with the §6.6 styles (hitam solid / kuning bertep hitam / abu putus-putus), no unlabeled number; F-08 — tapping a field opens PanelJejak with sumber, tanggal snapshot, rumus untuk field turunan (plain-language formula), batas, and a **copyable** official record ID; drawer-from-bottom on mobile, side panel on desktop |
| T-20 | F-12 banner in `DossierView.tsx` ("Data resmi per {snapshot_tanggal}. Bukan data real-time.") fed from data, not hardcoded; `POST /api/visit-reports` complete: device-id validation, zod body (`dossierSlug`, `activityStatus`, `note` ≤200), 5/hour/device rate limit, slug→project key resolution, insert into `kunjungan` with unique-constraint → 409 "Sudah melapor hari ini untuk proyek ini.", counts via `visit_report_counts` RPC, all error paths mapped | Verify the **kunjungan unique constraint** actually enforces 1 report per device **per day** (§7.3: unique on `kunci_proyek`, `perangkat_hash`, `tanggal`) — check `supabase/migrations/` and that `tanggal` is stored as a date, not timestamp, or the constraint degenerates to per-forever. Verify banner also appears on the `official_record` dossier variant and the `/examples/[exampleId]` static dossiers (F-12 says dossier, all variants). Confirm rate-limit + already-reported flows with real requests against `npm run dev` |
| T-21 | `VisitReportForm.tsx` (state select with the three Indonesian labels, optional note, device-id in localStorage, success message showing counts labeled "Laporan warga, belum diverifikasi.") | KP F-14 gaps to verify: note must be **filtered of forbidden words (§6.7) and person names before any display** — current design stores raw and never displays notes publicly, which satisfies PRD ("cukup tidak ditampilkan publik; tersimpan untuk tim") — confirm no code path renders `catatan`; counts display must show **jumlah only, never a percentage**; the exact §8.4 limit text "Sudah melapor hari ini untuk proyek ini." on the 409; success message wording is not §8.4-governed but must stay neutral and labeled |

Environment facts: `MODEL_API_KEY` is not set (intentional; PRD §7.4 interim contract — keep `/api/extract` returning 503 `MODEL_NOT_CONFIGURED`). The DB may or may not be reachable from your session; tests that need the DB should be structured so unit tests (`npm test`) never require it.

## 3. Task instructions (execute in this order)

### T-18 — ring and label functions to full KP
- Extract the §6.5 fallback precedence (total: `board.durationDays ?? record.masa_hari ?? null`; start: `record.tanggal_kontrak ?? board.contractDate ?? null`) into a pure function in `src/lib/cincin.ts` (e.g. `inputCincin(board, record)`) and call it from `DossierView.tsx`. Add Vitest cases for: board-only, record-only, both, neither.
- Decide and test `masaHari <= 0` → `tak_terhitung` (never divide-by-zero, never a filled ring).
- Keep all existing `hitungCincin` tests green; add a case for a start date in the future (negative `berjalan` → clamp to 0, state `berjalan`).
- `label.ts`: add a test asserting `persen_progres` stays `belum_diketaahui`-labeled even if someone passes extra args — the invariant must not be breakable by future edits.
- Acceptance (PRD): three ring states pass unit tests — already true, keep true, and now with fallback + edge cases covered.
- Commit: `refactor(cincin): pure fallback precedence + edge-case tests (T-18)` (or `fix:` if behavior changed).

### T-19 — components to full KP F-06…F-08
- Walk each KP bullet of F-06, F-07, F-08 against the rendered components and fix what fails. In particular:
  - **F-06:** the three ring states each render from example data (`/examples/[id]` static dossiers must include one example per state, if they don't already); disclaimer text always present; §6.5 wording exact.
  - **F-07:** audit `DossierView.tsx` row by row — every number, date, and statement gets exactly one `LabelTiga` badge with the correct §6.6 style. No row without a label; no row with two.
  - **F-08:** PanelJejak content per field: sumber (papan terkonfirmasi / ID catatan resmi), tanggal snapshot, rumus in plain Indonesian for derived values ("Hari ke-74 dihitung dari tanggal kontrak dikurangi tanggal mulai" style), batas; record ID copyable (clipboard + fallback select). Mobile: bottom drawer; desktop: side panel — verify at 360 px and ~1280 px.
- Verify visually with the browser if tooling allows (`/examples/[id]` needs no API or DB); otherwise state precisely which checks were code-traced only.
- Acceptance: every KP bullet of F-06, F-07, F-08 demonstrably met.
- Commit: `feat(ui): Cincin/ChipStatus/LabelTiga/PanelJejak meet KP F-06–F-08 (T-19)` (split per component if fixes are separable).

### T-20 — banner + kunjungan table/endpoint audit
- Migration check: read `supabase/migrations/` and confirm `kunjungan` has the §7.3 columns and the unique constraint on (`kunci_proyek`, `perangkat_hash`, `tanggal`) with `tanggal` a true `date`. If the constraint is missing or degenerate, add an idempotent migration — never destructive to applied remote data.
- Live check (DB reachable): POST `/api/visit-reports` twice with the same device-id and dossier → second must be 409 with the §8.4 text; a 6th report within an hour from one device → 429; unknown slug → 404; note >200 chars → 400. If DB is not reachable, verify by code trace + unit tests on the schemas and say so.
- Confirm the F-12 banner renders on every dossier variant (match-origin, `official_record`, examples) with the date from data.
- Acceptance: KP F-12 met (banner everywhere, date from data) and the F-14 backend contract behaves per §7.5.
- Commit: `fix(api): ...` / `fix(db): ...` only if changes were needed.

### T-21 — "Saya sudah lihat" form to full KP F-14
- KP walk: one keadaan of three, optional note ≤200, no account; 1 report per device per project per day (UX side: the 409 message must surface the exact §8.4 text — verify the client actually shows the server message it receives); counts shown as **jumlah** per keadaan with label "Laporan warga, belum diverifikasi"; **no percentage anywhere**; `catatan` never rendered publicly.
- Add forbidden-word filtering as defense-in-depth at the API boundary (strip/replace §6.7 words in `note` before storage is NOT required — PRD allows store-raw-never-display; but if any code path ever displays a note, filter first. If none displays, add a code comment asserting this invariant and a unit test locking the schema: note is optional, ≤200).
- Verify on a 360 px viewport: select, textarea, submit, and the success/limit messages all usable.
- Acceptance: every KP F-14 bullet demonstrably met.
- Commit: `feat(ui): Saya-sudah-lihat form meets KP F-14 (T-21)`.

## 4. Hard rules

- **Vocabulary (PRD §6.7):** the words korupsi, markup, fiktif, curang, penipuan, bermasalah, gelap, terlambat, molor, mangkrak, hilang, disembunyikan must never appear in user-visible text. Sanctioned phrases only (§6.4/§6.5/§8.4). "Melewati masa kontrak tercatat X hari. Addendum atau perpanjangan mungkin ada." — exact.
- **Language split:** API field names and enum values are English camelCase (§7.5: `active`, `no_activity_seen`, `appears_complete`); all UI text is Bahasa Indonesia.
- **Labels are content, not decoration:** no number or claim in the dossier may render without exactly one of TERCATAT / HITUNGAN / BELUM DIKETAHUI. `persen_progres` is always BELUM DIKETAHUI.
- **Scope fence:** do not touch evidence-card generation (T-25), methodology (T-26), matching thresholds (`src/config/match.ts` is PM-frozen), extract behavior, or anything from T-10…T-17 beyond what T-18…T-21 require. Do not add accounts, maps, notifications, or percentage progress.
- **Security/privacy:** notes stored for the team only, never displayed publicly; no photo storage; keys only in server env; RLS stays on; client never touches the DB.
- **Commits:** small, conventional (`feat:`, `fix:`, `test:`, `docs:`), one logical change each, on `Task18-21`. Never commit `.env`, `supabase/.temp/`, or secrets. Do not push unless told.
- **If blocked** (Docker missing, DB unreachable, browser tooling unavailable): record it, do the maximal safe alternative (code trace + unit test), and continue — never fake results.

## 5. Definition of done — final report

After all tasks, run `npm test`, `npm run lint`, `npm run build`. Then output a report with:

1. A table: task → status (Selesai / Selesai bersyarat / Terblokir) → evidence (file, command output snippet, or manual check performed).
2. For each KP bullet of F-06, F-07, F-08, F-12, F-14: pass/fail and **how verified** (which test, which page at which viewport, which curl).
3. The vocabulary audit: confirmation that no §6.7 word appears in any user-visible string you touched (grep evidence).
4. Anything left for humans (live DB checks you could not run, visual QA on real phones, threshold tuning).
5. Full list of commits made.

Do not claim a task is done unless its "Selesai jika" criterion from PRD §10.2 is demonstrably met; say "Selesai bersyarat" when it depends on inputs you could not exercise (e.g. live DB), and say precisely which input.
