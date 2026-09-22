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
