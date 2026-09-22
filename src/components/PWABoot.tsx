import { useEffect } from "react";

/**
 * Registers /sw.js on real, deployed origins only. Skipped in dev, iframe
 * previews, and when ?sw=off is present (kill switch).
 *
 * NOTE: this used to also wire an online/offline banner and auto-sync of
 * queued lead-form inquiries. That was intentionally removed (Finding 12
 * follow-up, see AGENTS.md) — offline lead submission is disabled in favor
 * of always requiring a live Turnstile verification. Do not re-add a call
 * to syncOfflineInquiries()/enqueueInquiry() here without the project
 * owner's explicit approval.
 */
export function PWABoot() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const url = new URL(window.location.href);
    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    const isPreview = host.startsWith("id-preview--") || host.startsWith("preview--");
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
      window.requestIdleCallback(onIdle, { timeout: 3000 });
    } else {
      setTimeout(onIdle, 1500);
    }
  }, []);

  return null;
}
