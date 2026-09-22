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
