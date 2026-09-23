// Cloudflare Turnstile PUBLIC site key, shared by the Contact/Lead form and
// the Developer Application form.
//
// Why the fallback: `import.meta.env.VITE_TURNSTILE_SITE_KEY` is populated by
// Vite's build-time env loading (see @lovable.dev/vite-tanstack-config's
// `loadEnv(mode, cwd, "VITE_")`), which reads actual `.env` files / real
// `process.env` at build time — it does NOT read `wrangler.toml [vars]`.
// Cloudflare Worker `[vars]` are a runtime-only binding; they are never
// exposed to the Vite build step that produces the browser bundle. This is
// the same gap already documented in `src/integrations/supabase/client.ts`
// for VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY, and it silently left
// both Turnstile widgets unrendered (fail-closed `{TURNSTILE_SITE_KEY && ...}`
// guards in InquiryModal.tsx / DeveloperApplicationModal.tsx), which is why
// both forms blocked every submission with "Please complete the verification
// challenge before submitting" — the widget itself never rendered because
// this value came back `undefined` in the browser bundle.
//
// The site key is the PUBLIC Turnstile widget key — not a secret, safe to
// ship to the browser (the private TURNSTILE_SECRET_KEY stays a Cloudflare
// Worker Secret and is never referenced here — see turnstile-verify.server.ts).
// Keep this fallback in sync with wrangler.toml's VITE_TURNSTILE_SITE_KEY if
// the widget is ever recreated with a new site key.
export const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAFAEFl_2o7TbU47Z";
