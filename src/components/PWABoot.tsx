import { useEffect, useState } from "react";
import { toast } from "sonner";
import { syncOfflineInquiries } from "@/lib/sync-inquiries";

/**
 * Registers /sw.js on real, deployed origins only. Skipped in dev, iframe
 * previews, and when ?sw=off is present (kill switch).
 * Also wires online/offline UI + auto-sync of queued inquiries.
 */
export function PWABoot() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const url = new URL(window.location.href);
    const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    const isPreview =
      host.startsWith("id-preview--") ||
      host.startsWith("preview--");
    const killSwitch = url.searchParams.get("sw") === "off";
    const canRegister =
      "serviceWorker" in navigator &&
      import.meta.env.PROD &&
      !inIframe &&
      !isPreview &&
      !killSwitch;

    if (!canRegister) {
      if ("serviceWorker" in navigator && killSwitch) {
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      }
      return;
    }

    const onIdle = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("[pwa] sw register failed", err));
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(onIdle, { timeout: 3000 });
    } else {
      setTimeout(onIdle, 1500);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const goOnline = async () => {
      setIsOffline(false);
      const res = await syncOfflineInquiries();
      if (res.synced > 0) {
        toast.success(`${res.synced} queued inquiry${res.synced > 1 ? "ies" : ""} sent successfully.`);
      }
    };
    const goOffline = () => {
      if (navigator.onLine === false) setIsOffline(true);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    // Attempt initial sync in case there's a leftover queue.
    if (navigator.onLine) syncOfflineInquiries().then((r) => {
      if (r.synced > 0) toast.success(`${r.synced} queued inquiry${r.synced > 1 ? "ies" : ""} sent successfully.`);
    });
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!isOffline) return null;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-border/60 bg-background/90 px-4 py-2 text-xs shadow-lg backdrop-blur"
    >
      <span
        className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
        style={{ background: "#f59e0b" }}
      />
      <span className="align-middle">
        Offline — your inquiry will be saved and sent when your connection returns.
      </span>
    </div>
  );
}
