import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";
import webpush from "web-push";

/**
 * Deploy note — WEBHOOK_DISPATCH_SECRET must be set as a Cloudflare *secret*
 * (`wrangler secret put WEBHOOK_DISPATCH_SECRET`, or dashboard > Settings >
 * Variables and secrets with type "Secret"). It must NOT be added as a plain
 * [vars] entry in wrangler.toml, because that file is committed to git.
 *
 * The same value must exist as the Supabase Vault secret named
 * 'webhook_dispatch_secret', which is what
 * public.dispatch_push_for_notification() reads when it signs its call.
 *
 * If the variable is missing this endpoint fails closed with 503 rather than
 * silently accepting unauthenticated calls.
 */

/** Compare two secrets in constant time, without leaking their lengths. */
function secretsMatch(provided: string, expected: string): boolean {
  // Hashing first gives two fixed-length (32 byte) buffers, so timingSafeEqual
  // can never throw on a length mismatch and the comparison time does not vary
  // with how much of the secret the caller guessed correctly.
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/**
 * Minimal per-IP rate limit: 20 requests/minute.
 *
 * This is in-memory and therefore per-isolate — Cloudflare may run several
 * isolates, so the effective global limit is a loose multiple of this. That is
 * acceptable here: it exists to blunt trivial floods, while the shared secret
 * above is what actually enforces authorisation.
 */
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    // Opportunistic cleanup so the map cannot grow without bound.
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (now >= value.resetAt) hits.delete(key);
    }
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export const Route = createFileRoute("/api/public/hooks/dispatch-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const expectedSecret = process.env.WEBHOOK_DISPATCH_SECRET;
          if (!expectedSecret) {
            console.error("[dispatch-push] WEBHOOK_DISPATCH_SECRET is not configured");
            return new Response("webhook not configured", { status: 503 });
          }

          const providedSecret = request.headers.get("x-webhook-secret") ?? "";
          if (!secretsMatch(providedSecret, expectedSecret)) {
            return new Response("unauthorized", { status: 401 });
          }

          const ip =
            request.headers.get("cf-connecting-ip") ??
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "unknown";
          if (rateLimited(ip)) {
            return new Response("rate limit exceeded", {
              status: 429,
              headers: { "Retry-After": "60" },
            });
          }

          const body = (await request.json().catch(() => ({}))) as { notification_id?: string };
          const notifId = body.notification_id;
          if (!notifId) return new Response("missing notification_id", { status: 400 });

          const publicKey = process.env.VAPID_PUBLIC_KEY!;
          const privateKey = process.env.VAPID_PRIVATE_KEY!;
          const subject = process.env.VAPID_SUBJECT || "mailto:elfoinnovations@gmail.com";
          if (!publicKey || !privateKey)
            return new Response("vapid not configured", { status: 500 });
          webpush.setVapidDetails(subject, publicKey, privateKey);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: notif, error: nErr } = await supabaseAdmin
            .from("notifications")
            .select("id,user_id,title,body,link,category")
            .eq("id", notifId)
            .maybeSingle();
          if (nErr || !notif) return new Response("notif not found", { status: 404 });

          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("id,endpoint,p256dh,auth")
            .eq("user_id", notif.user_id);

          if (!subs || subs.length === 0) return Response.json({ sent: 0 });

          const payload = JSON.stringify({
            title: notif.title,
            body: notif.body ?? "",
            link: notif.link ?? "/",
            tag: notif.category ?? "elfo",
          });

          let sent = 0;
          const stale: string[] = [];
          await Promise.all(
            subs.map(async (s) => {
              try {
                await webpush.sendNotification(
                  { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                  payload,
                );
                sent++;
              } catch (err) {
                const status = (err as { statusCode?: number } | null)?.statusCode;
                if (status === 404 || status === 410) stale.push(s.id);
              }
            }),
          );
          if (stale.length) {
            await supabaseAdmin.from("push_subscriptions").delete().in("id", stale);
          }
          return Response.json({ sent, pruned: stale.length });
        } catch (err) {
          console.error("[dispatch-push]", err);
          return new Response(err instanceof Error && err.message ? err.message : "error", {
            status: 500,
          });
        }
      },
    },
  },
});
