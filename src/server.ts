import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Security headers applied to every response.
//
// script-src/style-src/font-src/connect-src carry extra allowances beyond
// 'self' for two features that are otherwise silently broken by a strict
// CSP:
//   - The Google Translate page-widget (src/i18n/index.ts) loads
//     translate.google.com's script, which in turn talks to
//     translate.googleapis.com and pulls resources from www.gstatic.com.
//   - Google Fonts (src/routes/__root.tsx) loads a stylesheet from
//     fonts.googleapis.com and font files from fonts.gstatic.com.
// Speech-to-text (site chat voice input) uses the browser's native
// webkitSpeechRecognition, not a page-level fetch, so it needs no
// connect-src entry — only the Permissions-Policy microphone allowance
// below. Chat-message translation runs server-side (createServerFn), so
// it never touches the page's connect-src either.
// Finding 12: Cloudflare Turnstile (contact/lead form + developer
// application form only — the chatbot is explicitly excluded from this
// fix) loads its script from challenges.cloudflare.com and renders its
// widget in an iframe from the same origin, so both script-src and
// frame-src need it. siteverify itself is a server-to-server call from
// src/lib/turnstile-verify.server.ts and never touches the browser, so no
// connect-src entry is needed for it.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "connect-src 'self' https://gwkwpbrlrmqrsdjnnckb.supabase.co wss://gwkwpbrlrmqrsdjnnckb.supabase.co https://translate.googleapis.com https://translate.google.com",
  "script-src 'self' 'unsafe-inline' https://translate.google.com https://www.gstatic.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "frame-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
].join("; ");

function applySecurityHeaders(response: Response): Response {
  const cloned = new Response(response.body, response);
  cloned.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  cloned.headers.set("X-Frame-Options", "DENY");
  cloned.headers.set("X-Content-Type-Options", "nosniff");
  cloned.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  cloned.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  return cloned;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return applySecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
