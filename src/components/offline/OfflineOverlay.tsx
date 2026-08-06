import { useEffect, useRef, useState } from "react";
import { ElfoLogo } from "@/components/brand/Logo";
import CodeRunnerGame from "./CodeRunnerGame";

/**
 * Global offline overlay.
 * - Intercepts same-origin link clicks while offline.
 * - Shows a premium fullscreen overlay with an optional Code Runner mini-game.
 * - When connection is restored, offers to continue to the originally requested URL.
 */
export function OfflineOverlay() {
  const [open, setOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [online, setOnline] = useState(true);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") setOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onClick = (e: MouseEvent) => {
      if (navigator.onLine) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const a = target.closest("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      // Ignore explicit new-tab, downloads, external, hashes, mail/tel
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (/^(mailto:|tel:|sms:|javascript:)/i.test(href)) return;
      let url: URL;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      // Same page + hash — allow default scroll
      if (url.pathname === window.location.pathname && url.hash) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
      setOpen(true);
      restoredRef.current = false;
    };

    const onOnline = () => {
      setOnline(true);
      if (open) restoredRef.current = true;
    };
    const onOffline = () => setOnline(false);

    document.addEventListener("click", onClick, true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const close = () => { setOpen(false); setShowGame(false); setPendingHref(null); };
  const continueNav = () => {
    const href = pendingHref;
    close();
    if (href) window.location.href = href;
  };
  const restored = online && restoredRef.current;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Offline"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050a24]/95 backdrop-blur-md animate-fade-in"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(rgba(124,196,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(124,196,255,0.4) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative flex h-full w-full max-w-5xl flex-col p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <ElfoLogo size="sm" />
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-widest text-white/70">
            <span className={`h-2 w-2 rounded-full ${restored ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
            {restored ? "Online" : "Offline"}
          </div>
        </div>

        {/* Body */}
        {!showGame ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-scale-in">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-widest text-blue-300">
              Elfo Innovations
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', system-ui" }}>
              {restored ? "Connection Restored" : "You're Offline"}
              <span className="ml-2">{restored ? "✅" : ""}</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm sm:text-base text-white/70">
              {restored
                ? "You're back online. Continue to the page you requested, or keep playing."
                : "Your internet connection has been lost. While you wait, enjoy a quick game built by Elfo Innovations."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {restored && pendingHref ? (
                <>
                  <button
                    onClick={continueNav}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(59,130,246,0.8)] hover:opacity-90"
                  >
                    Continue to requested page →
                  </button>
                  <button
                    onClick={() => setShowGame(true)}
                    className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
                  >
                    Keep Playing
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowGame(true)}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(59,130,246,0.8)] hover:opacity-90"
                  >
                    ▶ Play Game
                  </button>
                  <button
                    onClick={close}
                    className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
                  >
                    Stay on Current Page
                  </button>
                </>
              )}
            </div>

            <p className="mt-10 text-[11px] uppercase tracking-[0.3em] text-white/40">
              Code Runner · Deliver code to the server
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col animate-fade-in">
            {restored && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 animate-scale-in">
                <span>✅ You're back online.</span>
                <div className="flex gap-2">
                  {pendingHref && (
                    <button onClick={continueNav} className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-950 hover:opacity-90">
                      Continue to requested page
                    </button>
                  )}
                  <button onClick={close} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10">
                    Close
                  </button>
                </div>
              </div>
            )}
            <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <CodeRunnerGame paused={restored} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
              <span>Swipe / ← → to change lanes · Tap / Space to jump. Collect <code>&lt;/&gt;</code>, <code>{"{}"}</code>, AI, ☁. Dodge bugs & firewalls.</span>
              <button onClick={() => setShowGame(false)} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10">
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
