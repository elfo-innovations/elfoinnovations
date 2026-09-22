# AI Work History

This file is a short-term handoff log for all AI agents working on this repository.

Its purpose is to help the next AI quickly understand what other agents have recently done, especially when work is interrupted, handed off, or continued by a different AI.

## Rules

### 1. Every AI must update this file

Whenever you make meaningful changes to the repository, update this file before finishing your session.

Include:

* **Date and time** of the work
* **AI/agent** if identifiable
* What was changed
* Why it was changed
* Important files affected
* Commit hash if committed
* Whether the changes were pushed
* Any unfinished work or things the next AI needs to know

Keep entries short and practical.

### 2. Record commits and push status

If you created a commit, include its commit hash.

Example:

```text
Commit: a83c282
Status: Committed and pushed
```

If changes are only local:

```text
Status: Changes are local and NOT pushed
```

This is important because another AI or the project owner may continue working before the previous AI's session/limit resets.

### 3. Record unfinished work

If you run out of tool calls, hit a limit, stop midway, or leave something for another AI, explicitly record:

* What was completed
* What remains
* Where you stopped
* Any known errors
* What the next AI should do first

Never leave the next AI guessing.

### 4. Check this file before starting work

Before making changes, read:

```text
AGENTS.md
HISTORY.md
```

Then check the current Git state:

```bash
git status
git log --oneline -10
```

Do not assume another AI has not changed the repository since your last session.

### 5. Keep only the last 7 days

This is a **rolling 7-day history**, not a permanent changelog.

Keep entries from the current day and previous 6 days.

When a new day makes an entry older than 7 days, remove that entry.

Do not allow this file to become a huge permanent history.

Git itself remains the permanent source of commit history.

### 6. Important discoveries

If you discover a project-specific problem or something that future AIs should permanently avoid, do **not** rely only on this file.

Add the permanent rule to `AGENTS.md`.

Use:

* `HISTORY.md` → **What happened recently**
* `AGENTS.md` → **Rules and lessons that should remain permanently**

### 7. Keep entries concise

Do not write a long explanation of every command you ran.

The goal is a quick handoff between AIs.

## Entry Format

Use this format:

```text
## YYYY-MM-DD HH:MM PKT — AI/Agent

### Completed
- Brief description of work completed.
- Important files changed.

### Commit
- `abcdef1` — commit message
- Status: Committed and pushed

### Notes
- Important context for the next AI.
- Any remaining issue or follow-up.

---
```

## Example

```text
## 2026-09-22 10:30 PKT — AI Agent

### Completed
- Fixed Cloudflare Worker configuration in `wrangler.toml`.
- Worker name is now `elfoinnovations`.
- Verified local Wrangler dry-run successfully.

### Commit
- `10f074a` — `.toml first line change removed hyphen between elfoinnovations`
- Status: Committed and pushed

### Notes
- Cloudflare deployment initially failed after adding `packageManager: "npm@12.0.2"`.
- That change was reverted because Cloudflare's dependency installation failed.
- Current Cloudflare deployment is successful.

---
```

## Recent Entries




## 2026-09-22 13:11 PKT — AI Agent (Claude)

### Completed
- Added a "Supabase Migration Drift" section (`## 14`) to `agents.md`, codifying the known drift between `supabase/migrations/` and the live database's tracked history (see Finding 8 lesson already in `## 13`). Covers: never blindly `supabase db push`/`migration repair`/reset; never rewrite or reorder historical migration files; always inspect live DB state before a change; always land new DB work as a forward-only migration; verify live state after applying; stop and report (don't guess) if repo and live state disagree; owner approval required before any deliberate drift repair. Appended only — nothing in the existing 13 sections was removed or altered.
- Corrected `supabase/config.toml`: `project_id` was the stale/abandoned `arxlqvcflzuskmkdzlwo`, pointing local CLI commands at a project that isn't the one in use. Changed to `gwkwpbrlrmqrsdjnnckb`, verified beforehand as the actual connected project via the Supabase MCP connector (`list_projects` — single active project, matches the one all DB verification this session was run against). This is a local CLI config correction only; no live database object was touched.
- No live database changes were made in this session.

### Commit
- `9ff0261` — `docs(agents): add Supabase migration-drift safety rules; fix(config): correct stale local project_id`
- Status: Committed and pushed

### Notes
- Unrelated observation, not acted on (out of scope for this task): `wrangler.toml` `name` is already `elfoinnovations` as of commit `10f074a` (pushed directly by the repo owner, not an AI agent) — the Worker-name mismatch flagged in earlier sessions appears already resolved outside this task. Left untouched here per instruction to make no unrelated changes; worth a fresh `wrangler deploy --dry-run` confirmation before the next real deploy.
- `agents.md` (this project's actual file, lowercase) already contained a `## 5 Cloudflare Worker Name` rule pinning the name to `elfoinnovations` and a matching lesson in `## 13`; no duplicate section was added for that.
- `agents.md` line ~15 currently contains an unusual note telling agents "the pat token we use is temperory ... dont worry about security" — flagged to the project owner in this session's chat as worth a second look, but left untouched since removing/editing it was outside this task's scope.

---

## 2026-09-22 13:05 PKT — AI Agent (Claude)

### Completed
- Finding 13 (pg_net extension registered in public schema, LOW). The finding's own
  ready-to-use prompt does not work as written -- did not follow it literally, see Notes.
- Verified live before changing anything: `net.http_request_queue` had 0 pending rows (nothing
  in flight to lose), and `net.http_post` is called from exactly one place in the codebase
  (`public.dispatch_push_for_notification()`).
- Applied migration `20260922130000_move_pg_net_extension_schema.sql`:
  `DROP EXTENSION pg_net; CREATE EXTENSION pg_net SCHEMA extensions;` -- this is what actually
  moves the linter-visible `pg_extension.extnamespace` from `public` to `extensions`. No code
  change: `dispatch_push_for_notification()` already calls `net.http_post` and still does.
- Verified live after applying: `pg_extension.extnamespace` for pg_net is now `extensions`; a
  real test request via `net.http_post` to httpbin.org completed with `status_code 200`
  (checked via `net._http_response`); `dispatch_push_for_notification()`'s body is
  byte-for-byte unchanged and its trigger on `public.notifications` is still attached/enabled.
- Deliberately did NOT insert a test row into `public.notifications` to fire the trigger
  end-to-end -- that would create a real (if briefly visible) fake notification for a real
  user. The checks above cover the only thing this migration could plausibly have broken.
- `npm run lint`/`tsc`/`vite build` unaffected (DB-only change) -- ran them anyway: still 0
  errors / 11 warnings, clean, passes.

### Commit
- `cad6944` -- `fix(db): move pg_net extension out of public schema (Finding 13)`
- Status: Committed and pushed to `main`. Applied directly to the live DB via Supabase MCP
  before committing the migration file (matches this repo's usual order for db fixes).

### Notes
- **The finding's ready-to-use prompt is wrong for this extension and would have broken the
  push-dispatch trigger if followed literally.** `ALTER EXTENSION pg_net SET SCHEMA extensions`
  fails outright -- pg_net is not relocatable (`pg_extension.extrelocatable = false`). And even
  if it didn't fail, there is no `extensions.http_post` to switch to: pg_net's docs confirm it
  always creates its real objects (`http_post`, `http_request_queue`, etc.) in a schema
  literally named `net`, regardless of which schema `CREATE EXTENSION` is given -- that
  argument only changes the extension's own bookkeeping entry, which is what the linter checks.
  Supabase's own default project setup does the same `CREATE EXTENSION pg_net SCHEMA
  extensions` and still calls `net.http_post` everywhere. **Lesson for future findings
  involving pg_net: never rewrite a `net.*` call site to `extensions.*` -- it will not exist.**
- Separate, lower-priority observation surfaced while investigating (NOT fixed, out of scope
  for Finding 13): the `net` schema's `USAGE` grant to `anon`/`authenticated` is a Supabase
  platform default (their `grant_pg_net_access()` event trigger), reapplied automatically
  whenever `pg_net` is (re)created -- this is why no grants needed to be manually restored
  after the drop/recreate above. It's not a live REST-facing SSRF path today because `net` is
  not in PostgREST's exposed schemas (`pgrst.db_schemas` is unset -> default `public` only),
  but it's worth a future finding if that setting ever changes.
- Nothing left unfinished from this session.

---

## 2026-09-22 12:20 PKT — AI Agent (Claude)

### Completed
- Reviewed the 18 remaining `npm run lint` warnings (14 `react-refresh/only-export-components`,
  4 `react-hooks/exhaustive-deps`) individually rather than mass-suppressing them.
- Fixed `HeroEditor`/`AboutEditor` in `admin.web-portal.tsx`: both used `useMemo` purely for a
  side effect (`setF` on data load), which is not something React guarantees the timing of.
  Replaced with `useEffect` + a functional state update; this also removed the root cause of
  their exhaustive-deps warning instead of just silencing it.
- Extracted 3 non-component helpers into their own lib files to fix the react-refresh warning
  at the source: `defaultPhone`/`PhoneValue` -> `src/lib/phone.ts`, `uploadToWebsiteMedia` ->
  `src/lib/media-upload.ts`, `sanitizeHtml` -> `src/lib/sanitize-html.ts`. The last one also
  stops the public blog page (`blogs_.$slug.tsx`) importing from an admin-only editor
  component, which was an odd dependency regardless of the lint warning.
- Left 2 exhaustive-deps warnings (`use-push-notifications.tsx`, `profile.tsx`) with an
  `eslint-disable-next-line` + comment: both intentionally depend on `user?.id` rather than
  the `user` object so the effect doesn't re-run on every auth-context re-render.
- Left 10 react-refresh warnings unchanged: 6 shadcn/ui primitives (component + cva variants)
  and 4 context hooks (Provider + useX) are both the standard, intentional pattern for their
  category. Splitting them would be a large diff for a dev-only Fast Refresh warning with zero
  runtime effect.
- `npm run lint`: 0 errors / 11 warnings (was 18). `tsc --noEmit` and `vite build` both pass.

### Commit
- `1e931ec` — `fix(lint): resolve 7 of the 18 remaining lint warnings, document the rest`
- Status: Committed and pushed to `main`.

### Notes
- Finding 12 (Turnstile, offline-queue removal) and all prior security work were not touched.
- `use-push-notifications.tsx` and `profile.tsx` still show as exhaustive-deps warnings in
  some tooling summaries because of the eslint-disable comment, not because they were missed
  — see the comment directly above each `}, [user?.id, ...])` line for the reasoning.
- Nothing left unfinished from this session.

---

## 2026-09-22 11:10 PKT — AI Agent (Claude)

### Completed
- Finding 12 (public form endpoints have no rate limiting or CAPTCHA), **scope: contact/lead form + developer-application form only — the site chatbot (`site_chat_logs`) is explicitly excluded from this fix per the project owner's instruction.**
- Added Cloudflare Turnstile:
  - `src/components/Turnstile.tsx` (new) — script-tag widget wrapper, exposes a `reset()` via ref.
  - `src/lib/turnstile-verify.server.ts` (new) — server-only `verifyTurnstileToken()`; fails closed (rejects the submission) if `TURNSTILE_SECRET_KEY` isn't configured.
  - `src/lib/leads.functions.ts` (new) — `submitLead` server fn. Moved the lead duplicate-check and insert server-side (previously two direct anon-RLS `supabase.from("leads")` calls from `InquiryModal.tsx`); verifies Turnstile before either.
  - `src/components/inquiry/InquiryModal.tsx` — step-2 now renders the Turnstile widget and routes the online submit path through `submitLead`.
  - `src/lib/developer-applications.functions.ts` — `submitDeveloperApplication` now requires `turnstileToken` on its input and calls `verifyTurnstileToken()` before the insert. Data shape/validation unchanged.
  - `src/components/recruitment/DeveloperApplicationModal.tsx` — renders the Turnstile widget before the submit button, gates `onSubmit`.
  - `wrangler.toml` — added `VITE_TURNSTILE_SITE_KEY` placeholder to `[vars]` with a comment that it must be replaced before deploy (both forms fail closed without it).
  - `src/server.ts` — CSP `script-src`/`frame-src` now allow `challenges.cloudflare.com` (Turnstile's script + widget iframe). No `connect-src` change needed — `siteverify` is a server-to-server call.
- **Offline lead submission removed by explicit project-owner decision** (this closed the `sync-inquiries.ts` bypass noted below in an earlier draft of this entry — see AGENTS.md section 12 for the permanent rule):
  - `src/components/inquiry/InquiryModal.tsx` — no longer calls `enqueueInquiry`. Pre-submit connectivity check shows "You're offline. Please connect to the internet and try again." A submission that fails mid-flight shows exactly "Submission failed. Please check your internet connection and try again." — no queueing, user retries manually.
  - `src/components/PWABoot.tsx` — removed the online/offline banner + `syncOfflineInquiries()` auto-sync effect. Service-worker registration logic (unrelated) left untouched.
  - `src/lib/offline-queue.ts` and `src/lib/sync-inquiries.ts` — confirmed (via repo-wide grep) they had exactly two consumers, `InquiryModal.tsx` and `PWABoot.tsx`, both now disconnected. Left in place, unused, per instruction — not deleted.
- `npm run typecheck`, `npm run lint` (0 new errors, same pre-existing warning baseline), `npm run build` all pass.
- `package-lock.json` picked up incidental npm-version churn from a local `npm install` needed to run the checks — reverted before review, not part of this commit.

### Commit
- `bdcbd33` — `fix(security): add Cloudflare Turnstile to lead + developer application forms, disable offline lead queueing (Finding 12)`
- Status: Committed and pushed to `main`.

### Notes
- **Deployment blocker, by design (fail-closed):** `VITE_TURNSTILE_SITE_KEY` in `wrangler.toml` is a placeholder and `TURNSTILE_SECRET_KEY` has not been set as a Cloudflare Secret. Until both are configured with real values, the lead form and developer-application form will refuse every submission with a "verification unavailable" error rather than silently skip the check. This is intentional — do not "fix" it by making the check optional.
- The `sync-inquiries.ts` Turnstile-bypass gap (flagged earlier this session) is now resolved by removing offline lead submission entirely rather than patching the sync path — see AGENTS.md section 12. `offline-queue.ts`/`sync-inquiries.ts` remain in the repo, unused; do not re-wire them up without the project owner's explicit approval.
- Site chatbot (`SiteChatWidget.tsx`, `site_chat_logs`) was intentionally left completely unmodified — explicitly out of scope for this fix per instruction, despite being named in the original Finding 12 text as lower-priority in-scope.
- Nothing else left unfinished from this session's Finding 12 work.

---

## 2026-09-22 10:34 PKT — AI Agent (Claude)

### Completed
- Finding 11 (No server-side route guard on dashboard routes): added `src/lib/route-guards.ts` exporting `requireRole(allowedRoles)`, a `beforeLoad` handler. Added `beforeLoad: requireRole([...])` to all 13 `admin.*.tsx`, 7 `client.*.tsx`, and 4 `developer.*.tsx` route files (24 total), matching each group's role. No component/loader logic touched.
- **Deviated from the ready-to-use prompt on purpose, and this matters for future agents**: this app's Supabase session lives only in browser localStorage (`src/integrations/supabase/client.ts`) — nothing carries it to the server on a plain page load (no cookie; `auth-middleware.ts` requires an explicit `Authorization` header and is only wired up for server-function calls, not page navigation). Calling `supabase.auth.getSession()` unconditionally inside `beforeLoad` would report signed-out on every SSR page load — hard refresh, direct/bookmarked link — even for real signed-in users, and redirect all of them to `/auth`. That would have been a severe regression, not a fix. `requireRole()` is therefore a no-op when `typeof window === "undefined"` (SSR) and only enforces in the browser. This still closes the gap for same-session, in-app navigation (sidebar links, tab switches — the vast majority of dashboard traffic) without breaking hard reloads for real users. RLS remains the real, always-on data boundary regardless.
- Verified `npm run typecheck`, `npm run lint` (0 new errors/warnings vs. baseline), `npm run build` all pass.
- Important files: `src/lib/route-guards.ts` (new), all 24 `admin.*`/`client.*`/`developer.*` route files under `src/routes/`.

### Commit
- `8f57bc3` — `fix(security): add beforeLoad role guard to admin/client/developer routes (Finding 11)`
- Status: Committed and pushed

### Notes
- If a future finding asks for a "server-side" auth check again: check whether it's actually server-visible first. This app's auth is browser-only (localStorage), so anything called `beforeLoad`/`loader` that hits `supabase.auth.getSession()` needs the same SSR no-op guard, or it will false-positive on every hard page load. Don't assume a fix prompt has already accounted for this — verify by reading `client.ts` and `auth-middleware.ts` before writing the guard.
- Also be careful editing route files programmatically (I did this with a script for all 24 files): a naive "insert after the first `import` line" approach breaks on multi-line `import { A, B, C } from "..."` statements — track brace depth, not just line prefixes, or you'll silently corrupt a file's import block. Caught and fixed this before committing; always re-check the full diff of every touched file, not just a sample.
- Nothing left unfinished from this session.

---

## 2026-09-22 10:26 PKT — AI Agent (Claude)

### Completed
- Finding 10 (No HTTP security headers anywhere): added `applySecurityHeaders()` in `src/server.ts`, applied to both the normal SSR response and the catch-all error branch. Sets CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy (microphone=(self) for site chat voice input).
- The finding's suggested CSP (script-src/style-src/connect-src limited to 'self' + Supabase) would have broken two real features — verified by reading the code, not assumed:
  - Google Translate page widget (`src/i18n/index.ts`) loads `translate.google.com`, which talks to `translate.googleapis.com` and `www.gstatic.com`.
  - Google Fonts (`src/routes/__root.tsx`) loads `fonts.googleapis.com` (stylesheet) + `fonts.gstatic.com` (fonts).
  Both hosts are now allowed in the relevant directives; everything else stays locked to 'self'.
- Verified with `npm run typecheck`, `npm run lint`, `npm run build`, and a real `wrangler dev --local` run — checked response headers via `curl -I` on a normal SSR page, a 404, and confirmed the error branch also wraps headers.
- Important file: `src/server.ts`.

### Commit
- `e9842e5` — `fix(security): add CSP and other security headers to all server responses (Finding 10)`
- Status: Committed and pushed

### Notes
- Also closed Finding 8 earlier this session (see commit `b69ceaf` and the live-DB fix below) — not code, so no separate HISTORY entry was made for it until now; noting it here for continuity.
- Finding 8 (schema drift): the "missing columns on website_sections/hero_content" part of that finding was a miscalculation — live columns matched committed migrations exactly, verified via `list_tables` (Supabase MCP). The real gap was that the already-committed `promo_settings` catch-up migration (`20260921120000_add_promo_settings_table.sql`) was never registered in Supabase's `schema_migrations` tracking table. Registered it directly against the live DB (did NOT re-run the CREATE TABLE — table already existed, would have errored). Added a lesson to `AGENTS.md` about this class of drift.
- If asked to look at security headers again: don't just paste a finding's suggested CSP verbatim — this repo dynamically loads third-party scripts (Google Translate) and external stylesheets (Google Fonts), so always grep `src/` for `https://`, `createElement("script")`, and `<link rel="stylesheet">` before tightening `script-src`/`style-src`/`connect-src`.
- Nothing left unfinished from this session.

---


## Most Important Rule

**Every AI that works on this repository must maintain this file.**

If you make a meaningful change, record it.

If you commit, record the commit.

If you push, record that it was pushed.

If you stop before finishing, record exactly where you stopped.

The next AI may start working immediately without waiting for you to return or for your usage limit to reset, so leave enough context for another agent to safely continue.
