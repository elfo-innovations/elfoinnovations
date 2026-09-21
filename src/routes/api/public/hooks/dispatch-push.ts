import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import webpush from "web-push";

// Finding 5: this endpoint is public (triggered by Postgres via pg_net, not
// by a logged-in browser), so it can't rely on a Supabase session. It is
// instead gated by a shared secret set on both sides:
//   - Postgres: supabase/migrations/20260921150000_webhook_dispatch_secret.sql
//     reads it from Vault and sends it as the x-webhook-secret header.
//   - Cloudflare: it must be set as a Worker *secret* (not a [vars] entry,
//     which is stored in plaintext in wrangler.toml / the dashboard) via:
//       wrangler secret put WEBHOOK_DISPATCH_SECRET
const RATE_LIMIT_MAX = 20; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute, per IP

// Best-effort in-memory limiter. Workers isolates are ephemeral and this
// state isn't shared across regions/instances, so it won't catch a
// distributed flood — but it stops a single-source replay/spam loop, which
// is the actual threat model here (a leaked or guessed notification_id
// being hammered from one place). A KV-backed limiter would be needed for
// stronger guarantees.
const hitLog = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hitLog.get(ip);
  if (!entry || now > entry.resetAt) {
    hitLog.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on mismatched lengths, so pad the shorter one
  // first — this keeps the comparison itself constant-time and never lets
  // a length mismatch short-circuit into a throw/branch on secret length.
  const len = Math.max(bufA.length, bufB.length, 1);
  const paddedA = Buffer.alloc(len);
  const paddedB = Buffer.alloc(len);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return timingSafeEqual(paddedA, paddedB) && bufA.length === bufB.length;
}

export const Route = createFileRoute("/api/public/hooks/dispatch-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const expectedSecret = process.env.WEBHOOK_DISPATCH_SECRET;
          if (!expectedSecret) {
            // Fail closed: an unconfigured secret must never mean "accept
            // everything". Deploy config must set this before push actually
            // needs to work in this environment.
            console.error("[dispatch-push] WEBHOOK_DISPATCH_SECRET not configured");
            return new Response("not configured", { status: 500 });
          }

          const providedSecret = request.headers.get("x-webhook-secret") ?? "";
          if (!timingSafeStringEqual(providedSecret, expectedSecret)) {
            return new Response("unauthorized", { status: 401 });
          }

          const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
          if (isRateLimited(ip)) {
            return new Response("rate limited", { status: 429 });
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
              } catch (err: any) {
                const status = err?.statusCode;
                if (status === 404 || status === 410) stale.push(s.id);
              }
            }),
          );
          if (stale.length) {
            await supabaseAdmin.from("push_subscriptions").delete().in("id", stale);
          }
          return Response.json({ sent, pruned: stale.length });
        } catch (err: any) {
          console.error("[dispatch-push]", err);
          return new Response(err?.message || "error", { status: 500 });
        }
      },
    },
  },
});
