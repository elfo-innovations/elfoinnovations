import { createFileRoute } from "@tanstack/react-router";
import webpush from "web-push";

export const Route = createFileRoute("/api/public/hooks/dispatch-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as { notification_id?: string };
          const notifId = body.notification_id;
          if (!notifId) return new Response("missing notification_id", { status: 400 });

          const publicKey = process.env.VAPID_PUBLIC_KEY!;
          const privateKey = process.env.VAPID_PRIVATE_KEY!;
          const subject = process.env.VAPID_SUBJECT || "mailto:elfoinnovations@gmail.com";
          if (!publicKey || !privateKey) return new Response("vapid not configured", { status: 500 });
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
                  payload
                );
                sent++;
              } catch (err: any) {
                const status = err?.statusCode;
                if (status === 404 || status === 410) stale.push(s.id);
              }
            })
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
