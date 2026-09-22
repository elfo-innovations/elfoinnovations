import { forwardRef, useEffect, useImperativeHandle, useId, useRef } from "react";

// Cloudflare Turnstile — official script-tag integration (not the npm
// wrapper) per project convention: one script load, `window.turnstile`
// render API. Keeps this component dependency-free and CSP-friendly
// (script-src already allowlists challenges.cloudflare.com in src/server.ts).
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type TurnstileWidgetId = string;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      size?: "normal" | "compact" | "invisible" | "flexible";
      theme?: "light" | "dark" | "auto";
    },
  ) => TurnstileWidgetId;
  reset: (widgetId?: TurnstileWidgetId) => void;
  remove: (widgetId?: TurnstileWidgetId) => void;
  execute: (widgetId?: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileOnLoadCallbacks?: Array<() => void>;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if (window.turnstile) return resolve();
    const existing = document.querySelector(`script[src^="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Turnstile script failed to load")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = `${SCRIPT_SRC}?render=explicit`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export type TurnstileHandle = {
  reset: () => void;
};

/**
 * Cloudflare Turnstile widget. Renders visibly (size="invisible" is also
 * supported for the chat widget's silent first-message check). Calls
 * onVerify(token) once solved; the token is single-use and short-lived, so
 * callers should submit promptly and call reset() after a failed/duplicate
 * submit so the user (or the invisible flow) gets a fresh token.
 */
export const Turnstile = forwardRef<
  TurnstileHandle,
  {
    siteKey: string;
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    size?: "normal" | "compact" | "invisible" | "flexible";
    className?: string;
  }
>(function Turnstile({ siteKey, onVerify, onExpire, onError, size = "normal", className }, ref) {
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<TurnstileWidgetId | undefined>(undefined);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let renderedWidgetId: TurnstileWidgetId | undefined;
    loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        const el = document.getElementById(containerId);
        if (!el || !window.turnstile) return;
        renderedWidgetId = window.turnstile.render(el, {
          sitekey: siteKey,
          size,
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onErrorRef.current?.(),
        });
        widgetIdRef.current = renderedWidgetId;
      })
      .catch(() => onErrorRef.current?.());
    return () => {
      cancelled = true;
      if (renderedWidgetId && window.turnstile) window.turnstile.remove(renderedWidgetId);
    };
    // siteKey/size intentionally excluded from deps — this widget is not
    // designed to be reconfigured after mount; parents that need a fresh
    // widget should remount via a `key` prop instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  return <div id={containerId} className={className} />;
});
