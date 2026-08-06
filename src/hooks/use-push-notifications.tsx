import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/vapid";
import { saveSubscription } from "@/lib/push.functions";

export function usePushNotifications() {
  const { user } = useAuth();
  const save = useServerFn(saveSubscription);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        let perm = Notification.permission;
        if (perm === "default") perm = await Notification.requestPermission();
        if (perm !== "granted") return;

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
          });
        }
        if (cancelled) return;
        const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
        await save({
          data: {
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            user_agent: navigator.userAgent,
          },
        });
      } catch (err) {
        console.warn("[push] subscription failed", err);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, save]);
}

export function PushNotificationsBoot() {
  usePushNotifications();
  return null;
}
