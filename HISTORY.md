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

## 2026-10-01 PKT — AI Agent (Claude) — CI lockfile fix + URL migration trial (3+3)

### Context
Two separate follow-ups requested by the project owner in the same session: (1) a
GitHub Actions `security-audit.yml` failure (`npm ci` — lockfile out of sync,
`Missing: lru-cache@11.5.3 from lock file`) reported via a GitHub AI prompt, and
(2) kick off the long-planned `media_library.public_url` / `blogs.content_html`
URL migration (old Supabase signed URLs -> `media.elfoinnovations.com`) with a
small 3-of-71 / 3-of-93 trial batch first, to verify nothing breaks before the
full run.

### Completed — CI/lockfile fix
- Reproduced the failure locally first (`rm -rf node_modules && npm ci` ->
  same `Missing: lru-cache@11.5.3` error as the CI run).
- `npm install --package-lock-only` — regenerated the lockfile only;
  `package.json` has a zero-line diff.
- `npm audit fix` (no `--force`) — resolved the 2 moderate + 2 high
  vulnerabilities (`brace-expansion`, `undici` via `wrangler`/`miniflare`, both
  dev/build tooling, never shipped to runtime). Verified every real version
  change stays within `package.json`'s already-declared semver ranges: notably
  `wrangler` 4.135.0 -> 4.145.0, still satisfies the existing `^4.135.0`. The
  ~13k-line raw diff is mostly npm's dependency-tree reshuffling (e.g. `sharp`
  binaries hoisted out of `wrangler`'s nested `node_modules`), not actual
  version churn — diffed package-by-package to confirm only 10 real version
  bumps total, all transitive, all in-range.
- Verified clean: fresh `rm -rf node_modules && npm ci` succeeds, `npm audit
  --audit-level=high` -> **0 vulnerabilities**. `lint` (0 errors / 11
  pre-existing warnings), `typecheck`, `build`, `test` (7/7) all pass.
- Commit `7fe1c97` — `fix(ci): regenerate package-lock.json to fix npm ci
  drift, resolve audit findings`. **Status: committed locally, NOT yet
  pushed** — no working GitHub PAT available this session (three tokens
  provided all failed GitHub's own `/user` API with `401 Bad credentials`,
  not a scope issue). Project owner needs to either supply a valid token or
  push this commit themselves / apply the equivalent patch.

### Completed — URL migration trial (3 of 71 `media_library` rows, 3 of 93 blog-content URLs)
- Re-verified live DB state immediately before writing anything (counts
  unchanged from the prior session's preview: 73 old `media_library` URLs, 22
  blogs with old signed URLs) — confirms nothing else touched this data in
  between sessions.
- **`media_library`**: updated 3 rows (`03f3cbab-...png`, `2349564f-...png`,
  `ce6002ab-...png`) via a deterministic per-row `UPDATE ... SET public_url =
  'https://media.elfoinnovations.com/' || storage_path`. Verified via
  `RETURNING`.
- **`blogs.content_html`**: updated exactly 3 of the 4 `blog-content/*` image
  URLs embedded in the `seo-services` post (left the 4th untouched on
  purpose, to keep this a true partial/scoped trial). Pulled the *current*
  live `content_html` first (not a cached copy), confirmed each target key
  appears exactly once via a length-diff occurrence count, then replaced the
  full old signed URL (path + `?token=...`) with the exact new
  `media.elfoinnovations.com` URL per key — never a blanket regex. Verified
  via `RETURNING` that all 3 targeted images now show the new URL and the
  4th (`1787727819979-...`) still shows its old URL, untouched.
- Post-check: `blogs` with at least one new URL = 1 (`seo-services`, as
  expected), old-URL blog count still 22 (that post still has 1 old URL left
  — correct for a 3-of-4 partial edit).
- **Could not independently verify the 6 new URLs are actually live** —
  this sandbox's network egress is restricted (`x-deny-reason:
  host_not_allowed` on `media.elfoinnovations.com`), same limitation noted in
  the DNS/custom-domain session. **Project owner needs to manually open these
  6 URLs (and the `seo-services` blog page itself) to confirm they load
  correctly before approving the full batch.**

### Commit
- `7fe1c97` — lockfile fix. Committed locally, not pushed (see above).
- URL migration trial: direct DB writes via the Supabase connector, not a
  git commit (no application code changed).

### Notes — what's left
- **Push `7fe1c97`** (needs a working GitHub PAT, or apply as a patch).
- **Verify the 6 trial URLs load** (3 `media_library` images + 3 images in
  the `seo-services` post) — blocked on project owner, not re-attemptable
  from this sandbox.
- Once verified: **remaining 68 `media_library` rows** and **remaining 90
  blog-content URL occurrences across 22 posts** (incl. the 4th image in
  `seo-services`) are still queued, same exact-match method, not yet applied.
- R2 credentials were added as Cloudflare Worker Secrets this session
  (per project owner) — **not independently verified from this sandbox**;
  worth a real upload-through-the-app test before relying on it.
- The 76 pre-existing orphaned `blog-content/*` objects (never referenced by
  any blog) remain untouched, as in every prior session.

---

## 2026-10-01 PKT — AI Agent (Claude)

### Context
Follow-up to the R2 migration: Kabeer reported that deleting a blog post (and
separately, deleting a Media Library item) left the underlying image still live
at its `media.elfoinnovations.com` URL. The Media Library case turned out to be
Cloudflare edge caching (resolved by a manual cache purge, not a code issue) —
but blog-content images had no delete path at all, before or after the R2
migration (same as the 76 pre-existing orphaned `blog-content/*` objects found
earlier). This entry adds that missing cleanup.

### Completed
- New `src/lib/blog-content-images.ts` — pure regex helper
  `extractBlogContentImageKeys(content_html)` that finds inline `blog-content/*`
  image references in a blog's HTML, split into R2 keys (`media.elfoinnovations.com/...`)
  and legacy Supabase signed-URL paths (`/object/sign/website-media/blog-content/...`,
  URL-decoded). Does NOT touch `cover_image` — that's a separate media_library
  asset with its own (already-existing) delete path.
- New `deleteBlogContentImagesFromR2` server function in
  `src/lib/media-upload.functions.ts` — same `requireSupabaseAuth` + `has_role
  admin` pattern as the other upload/delete functions, best-effort per key
  (one failed key doesn't block the others).
- `src/routes/admin.blogs.tsx`: blog `del()` now takes the full blog row (was
  just the id) so it has `content_html` available; after the `blogs` row is
  deleted, it fires-and-forgets cleanup of any R2 and/or legacy Supabase
  blog-content images that post referenced. Cleanup failure never blocks or
  rolls back the actual post deletion (row is already gone either way).
- Verified: `tsc --noEmit` clean, `eslint` clean, `prettier` applied, `npm run
  build` succeeds.

### Commit
- Status: committed locally, pushed to `main` (see commit hash in `git log`).

### Notes
- This only cleans up images for *future* blog deletions — it does not
  retroactively clean the 76 pre-existing orphaned `blog-content/*` objects
  (still untouched, as instructed in earlier sessions).
- Kabeer mentioned one more blog-related fix is pending — not yet described/
  started as of this entry.

---

## 2026-10-01 11:53 PKT — AI Agent (Claude)

### Context
Started a Supabase Storage → Cloudflare R2 migration for website/blog media (bucket
`website-media`). This session covers ONLY the application-code half: routing FUTURE
uploads to R2. The object-level copy of the 240 existing Supabase Storage objects into R2,
and the custom domain `media.elfoinnovations.com` → R2 binding, were done separately
(live infra, not from this sandbox) — not verifiable from here beyond independently
confirming via SQL that Supabase still reports 240 objects / 73 `media_library` rows
unchanged. No existing DB URLs were touched.

### Completed
- Added `aws4fetch` dependency and a new server-only R2 (S3-compatible) helper:
  `src/lib/r2.server.ts` — `uploadToR2`, `deleteFromR2`. Reads `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` from `process.env` (same convention as
  `SUPABASE_SERVICE_ROLE_KEY` etc. — must be set as Cloudflare Secrets, never committed).
- New server functions in `src/lib/media-upload.functions.ts`
  (`uploadMediaLibraryFile`, `deleteMediaLibraryR2Object`, `uploadBlogContentImage`),
  all behind `requireSupabaseAuth` + an inline `has_role admin` check (same pattern as
  `account.functions.ts`). These are the only code paths with R2 credential access.
- `src/lib/media-upload.ts`: `uploadToWebsiteMedia()` now base64-encodes the file and
  calls `uploadMediaLibraryFile` instead of uploading to Supabase Storage directly.
  Same function signature, same caller (`admin.web-portal.tsx`) — no call-site change.
- `src/components/web-portal/RichTextEditor.tsx`: inline blog image upload now calls
  `uploadBlogContentImage` instead of Supabase Storage. Exact same
  `blog-content/{timestamp}-{filename}` key format preserved. No `media_library` row
  created (matches prior behavior — inline blog images were never tracked there).
- `src/routes/admin.web-portal.tsx` Media Library delete: now branches on
  `isR2Url(m.public_url)` (new `src/lib/r2-url.ts`, pure/client-safe) — R2-hosted rows
  delete via `deleteMediaLibraryR2Object`, legacy Supabase-hosted rows still delete via
  the old `supabase.storage.remove()` path. Existing Supabase objects/URLs untouched.
- New shared client helper `src/lib/file-to-base64.ts` (mirrors the existing local
  helper in `DeveloperApplicationForm.tsx`) used by both upload call sites.
- `wrangler.toml`: added a comment documenting the three new required secrets
  (no actual values committed).
- Verified: `tsc --noEmit` clean, `eslint` clean on changed files (and whole-project
  lint still only has the same pre-existing unrelated warnings), `prettier --write` run
  on all changed files.

### Commit
- Status: Changes are local and NOT pushed yet (no GitHub PAT available this session).

### Notes
- Legacy/existing Supabase-hosted media (71 `media_library` rows, 93 blog-content image
  references) is untouched and must keep working as-is — do NOT run any URL rewrite
  against `media_library.public_url` or `blogs.content_html` without explicit instruction.
- The 76 orphaned `blog-content/*` objects (never referenced by any blog) were likewise
  left alone — no delete logic exists for them, same as before this change.
- R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) still need
  to be set as Cloudflare Worker Secrets (`wrangler secret put ...`) before a deploy will
  actually work — they were not set during this session.
- Next AI: do not assume the live R2 bucket's object count/contents match this repo's
  state — that data lives outside this sandbox. Re-verify via Supabase SQL
  (`storage.objects` / `media_library` counts) rather than trusting a prior summary.

---

## 2026-09-29 PKT — AI Agent (Claude) — Reviewed + fixed friend's push (blog SEO overhaul)

### Context
A teammate pushed a large blog/SEO feature push directly to `main` (commit `6a846f9`, 27 files,
~2090 insertions) covering: alt text + resizable images in the rich text editor, a proper
category picker (add-new), rich text (bold/links) in FAQ + TL;DR fields, the RichTextEditor
edit-not-loading bug, an RSS feed, blog category archive pages, and a `blog_redirects` table with
301-redirect logic for changed slugs — plus some unrelated homepage UI work (TestimonialsSection
redesign, ServicesScrollStory, a BackToTopButton). Project owner asked for a full review: fix
every real issue, but remove anything added that had no discoverable justification (not "wrong"
code — code with no understandable reason to exist).

### Completed
- **Verified the feature work is real and correct** — spot-checked each of the 5 originally
  reported issues (alt text, image resize, category add-new, edit-bug, FAQ/TL;DR rich text) plus
  RSS and the redirect table; all implemented soundly.
- **Removed one genuinely unexplained addition**: `'wasm-unsafe-eval'` and `worker-src 'self'
  blob:` had been added to the CSP in `src/server.ts`. Repo-wide search found no WebAssembly,
  Worker, or blob: usage anywhere that would need them — removed both, nothing else in the CSP
  touched.
- **Fixed real CI-breaking regressions the push introduced**:
  - `typecheck` was at 22 errors (baseline: 0). Root causes: (1) `/blogs` route's `page` search
    param was required, breaking every `<Link to="/blogs">` (Footer, blog pages) — made it
    optional with a `page ?? 1` default; (2) `blog_redirects`, `services.show_in_story`,
    `services.image_display_mode` exist live but `src/integrations/supabase/types.ts` was never
    regenerated, so a lot of code was working around it with `as any` — regenerated
    `types.ts` from the live schema (project `gwkwpbrlrmqrsdjnnckb`) instead of patching around
    it; (3) `head: ({ search }: { search: BlogSearch })` on `/blogs` and `head: ({ ...,
    search }: any)` on `/blogs/category/$category` don't match TanStack Start's actual `head`
    context shape (search lives at `ctx.match.search`, not `ctx.search`) — fixed both, and the
    `any` on the category route is gone with it.
  - `lint` was at 15 errors (baseline: 0, all `no-explicit-any` — now that `types.ts` is
    correct, ~10 `as any` casts in `admin.web-portal.tsx` and the `DEFAULTS`/`CARDS` typing +
    one `<Link to={... as any}>` in `ServicesScrollStory.tsx` were removed outright rather than
    re-typed, since the real types now satisfy them without a cast. Two remaining `string | null`
    vs `string` mismatches on `CardImage`'s `src` prop were resolved with a non-null assertion
    (`c.image_url!`), safe because the surrounding `layout` derivation already guarantees
    `image_url` is truthy before `CardImage` renders. `lint` is now 0 errors (11 pre-existing,
    unrelated `react-refresh` warnings remain, same as before this push).
  - Sanitized the new `/blogs` search-box query before it's interpolated into a PostgREST
    `.or()` filter string (`,()%*\` stripped) — untrusted input was going straight into a filter
    expression.
  - Moved the friend's new full blog-post page implementation from `blog_.$slug.tsx` (the old
    route, which used to be a 7-line redirect-to-`/blogs/$slug` shim) into `blogs_.$slug.tsx`
    (the real canonical route) and restored the redirect shim at `blog_.$slug.tsx` — the push had
    them backwards, which would have made `/blog/<slug>` the canonical URL instead of
    `/blogs/<slug>`.
- **Wrote the missing migration files** (3 catch-up migrations, all `IF NOT EXISTS`/`DO` guarded
  so they're safe to run against the already-patched live DB) — schema confirmed via
  `information_schema` + `pg_constraint` against the live project, not guessed:
  - `20260929080100_catchup_blogs_content_html_category_tldr.sql`
  - `20260929080200_catchup_services_display_columns.sql` (`image_display_mode`, `image_fit`,
    `show_in_story`, `show_in_grid`, `show_text` — all five existed live with no migration file)
  - `20260929080300_catchup_blog_redirects.sql` (table + both RLS policies, reproduced exactly
    from the live `pg_policies`/`pg_constraint` output)
- **Verified end-to-end**: `npm run typecheck` — 0 errors. `npm run lint` — 0 errors (11
  pre-existing warnings). `npm run build` — succeeds. Ran the actual built Worker locally via
  `wrangler dev --local` and confirmed `/`, `/blogs`, `/rss.xml`, `/sitemap.xml` all return 200.

### Files changed by this review (on top of the friend's push)
`src/server.ts`, `src/routes/blogs.tsx`, `src/routes/blogs_.$slug.tsx`, `src/routes/blog_.$slug.tsx`,
`src/routes/blogs_.category.$category.tsx`, `src/routes/admin.web-portal.tsx`,
`src/components/site/ServicesScrollStory.tsx`, `src/integrations/supabase/types.ts` (regenerated),
plus the 3 new migration files above.

### Commit
- `a053506` — `fix(blog): review + fix friend's blog SEO push, catch-up migrations, remove unexplained CSP extras`
- Status: Committed and pushed to `main` (confirmed present on `origin/main` as of 2026-09-29).

### Notes
- The unrelated homepage UI changes in the same push (TestimonialsSection redesign,
  ServicesScrollStory, BackToTopButton) were left as-is — they're coherent, well-built, explicable
  features, just out of scope for the blog/SEO task. "Remove unexplained extras" was interpreted
  as removing code with no discoverable purpose (like the wasm/worker CSP entries), not reverting
  unrelated-but-legitimate work.
- `image_fit` on `services` also had no migration file despite predating this specific push (it
  was already live) — included in the same catch-up migration since it's the same class of drift
  as the columns this push added.

---

## 2026-09-26 PKT — AI Agent (Claude) — CSP was blocking GA4 (googletagmanager.com)

### Completed
- Root cause: GA4's gtag.js was added to `src/routes/__root.tsx` on 2026-09-25 (see the entry
  below), but the site's Content-Security-Policy — a real HTTP response header set in
  `src/server.ts` via `applySecurityHeaders()`, applied to every response — was never updated to
  allow it. There is no CSP `<meta>` tag anywhere in this repo and no `_headers` file/Cloudflare
  Transform Rule in-repo either; `src/server.ts` is the sole place CSP is defined. Confirmed via
  repo-wide grep before changing anything.
- Appended (did not replace) two allowances to the existing `CONTENT_SECURITY_POLICY` array in
  `src/server.ts`:
  - `script-src`: added `https://www.googletagmanager.com` (the gtag.js loader script's origin).
  - `connect-src`: added `https://www.google-analytics.com https://*.google-analytics.com
    https://*.analytics.google.com https://*.googletagmanager.com` (GA4's hit/collect and
    config-follow-up requests).
  All prior entries in both directives (Google Translate, Google Fonts, Cloudflare Turnstile) are
  untouched.
- Verified with `npm run typecheck` (0 errors) and `npm run build` (OK), then ran the actual
  built Worker locally via `wrangler dev --local` and `curl -D -` against `http://127.0.0.1:8787/`
  — confirmed the live response's `Content-Security-Policy` header contains both the new and all
  pre-existing directives. `npm run lint`: 0 errors, same 11 pre-existing warnings as baseline.
- Important file: `src/server.ts` only.

### Commit
- `37964db` — `fix(security): whitelist Google Analytics (GA4) domains in CSP script-src/connect-src`
- Status: pushed directly to `main` (project owner's explicit instruction — a teammate is also
  working against `main` but had not pushed anything new as of this push; verified with
  `git fetch` immediately beforehand that `origin/main` had not moved since this branch was cut,
  so this was a clean fast-forward, not a forced/rewriting push).

### Exact change — for conflict resolution
Only **one file's content changed**: `src/server.ts`. (`HISTORY.md` also changed, but that's this
entry — a plain append, never a source of conflicts.) If you hit a merge/rebase conflict touching
`src/server.ts`, this is the **entire diff** — every other line in the file, and every other CSP
directive, is untouched:

```diff
--- a/src/server.ts
+++ b/src/server.ts
@@ (inside the CONTENT_SECURITY_POLICY comment block, before the array)
+// Google Analytics (GA4, gtag.js — src/routes/__root.tsx) loads its
+// loader script from googletagmanager.com and then sends hit/collect
+// requests to google-analytics.com and its regional analytics.google.com
+// subdomains, plus config/loader follow-up requests back to
+// googletagmanager.com subdomains — hence the wildcard connect-src
+// entries below rather than single hostnames.
 const CONTENT_SECURITY_POLICY = [
   "default-src 'self'",
-  "connect-src 'self' https://gwkwpbrlrmqrsdjnnckb.supabase.co wss://gwkwpbrlrmqrsdjnnckb.supabase.co https://translate.googleapis.com https://translate.google.com",
-  "script-src 'self' 'unsafe-inline' https://translate.google.com https://www.gstatic.com https://challenges.cloudflare.com",
+  "connect-src 'self' https://gwkwpbrlrmqrsdjnnckb.supabase.co wss://gwkwpbrlrmqrsdjnnckb.supabase.co https://translate.googleapis.com https://translate.google.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
+  "script-src 'self' 'unsafe-inline' https://translate.google.com https://www.gstatic.com https://challenges.cloudflare.com https://www.googletagmanager.com",
   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
   "font-src 'self' data: https://fonts.gstatic.com",
   "img-src 'self' data: https:",
```

**If a conflict marker appears on the `connect-src` or `script-src` lines**: the correct merged
line is whichever version has the *longest* URL list for that directive — every entry from both
sides should be present, space-separated, inside the same quoted string. Do not pick one side and
discard the other; these two lines are meant to keep growing as more third-party scripts get
added (Translate, Fonts, Turnstile, now GA4). If in doubt, the full current `connect-src` and
`script-src` strings are the two lines quoted above, post-fix — use those as the source of truth
for what must remain present.

### Notes
- Nothing else in the CSP was touched. `frame-src`, `style-src`, `font-src`, `img-src`,
  `frame-ancestors`, and `default-src` are unchanged from before this fix.
- This was pushed straight to `main` rather than via PR, per explicit project-owner instruction
  this session, after confirming `origin/main` had no new commits since the branch point.

---

## 2026-09-25 PKT — AI Agent (Claude) — Google Analytics (gtag.js) added site-wide

### Completed
- Added the owner's GA4 gtag.js snippet (measurement id `G-F6XNJQ18GP`) to `src/routes/__root.tsx`,
  in the root route's `head().scripts` array, right before the existing Organization/WebSite JSON-LD
  scripts. The root route's head renders on every route (it's the top of the route tree), so this
  loads on every page, not just the homepage.
- Verified in the rendered HTML for both `/` and `/faqs` under `wrangler dev --local`: the
  `googletagmanager.com/gtag/js?id=G-F6XNJQ18GP` script tag and the inline `gtag('config',
  'G-F6XNJQ18GP')` call are both present.
- No Supabase changes. Checks: typecheck 0 errors, lint 0 errors / 11 baseline warnings, tests
  7/7, build OK.

### Commit
- Pushed to `origin/main`; see `git log`.

---

## 2026-09-25 PKT — AI Agent (Claude) — Home FAQ section restyled to match /faqs

### Completed
- The home (and pricing) `FaqSection` still had the old Radix accordion look after the /faqs redesign.
  It now uses the same look as /faqs and the owner's reference image: glass card with brand gradient
  wash, category list on the left (tabs; horizontal chips on mobile), + / x accordion on the right.
- It shows only featured questions (admin "Show on the home page"; falls back to the first 6). Category
  tabs only list categories that have a featured question; "All Questions" is the default tab.
  "View all FAQs" button links to `/faqs`. Same data source as /faqs (`fetchFaqData`), with the built-in
  DEFAULT_FAQS fallback if the table is empty. Section keeps `id="faq"`.
- Shared pieces: `FaqShell`, `FaqRow` exported from `FaqExplorer.tsx`; `categoryItemClass` in
  `faq-styles.ts` (separate file to keep the react-refresh lint rule clean).
- Checks: typecheck 0 errors, lint 0 errors / 11 baseline warnings, tests 7/7, build OK; `/`, `/faqs`,
  `/pricing` return 200 under `wrangler dev --local` (sandbox cannot reach Supabase, so live data was not
  rendered locally).

### Commit
- Pushed to `origin/main`; see `git log`.

---
---


## Most Important Rule

**Every AI that works on this repository must maintain this file.**

If you make a meaningful change, record it.

If you commit, record the commit.

If you push, record that it was pushed.

If you stop before finishing, record exactly where you stopped.

The next AI may start working immediately without waiting for you to return or for your usage limit to reset, so leave enough context for another agent to safely continue.