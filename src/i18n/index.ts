import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import ar from "./locales/ar.json";
import ja from "./locales/ja.json";
import zh from "./locales/zh.json";
import ur from "./locales/ur.json";

export type LangCode = "en" | "es" | "fr" | "de" | "ar" | "ur" | "ja" | "zh";
export type LangScope = "public" | "admin" | "developer" | "client";

export const LANGUAGES: { code: LangCode; label: string; native: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", native: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "de", label: "German", native: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "ur", label: "Urdu", native: "اردو", flag: "🇵🇰", dir: "rtl" },
  { code: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵", dir: "ltr" },
  { code: "zh", label: "Chinese", native: "简体中文", flag: "🇨🇳", dir: "ltr" },
];

const STORAGE_PREFIX = "elfo-lang";
export const storageKeyFor = (scope: LangScope) => `${STORAGE_PREFIX}-${scope}`;

export function scopeFromPath(pathname: string): LangScope {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/developer")) return "developer";
  if (pathname.startsWith("/client")) return "client";
  return "public";
}

export function getScopedLang(scope: LangScope): LangCode {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(storageKeyFor(scope)) as LangCode | null;
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {}
  return "en";
}

function detectInitialLang(): LangCode {
  if (typeof window === "undefined") return "en";
  return getScopedLang(scopeFromPath(window.location.pathname));
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      ar: { translation: ar },
      ur: { translation: ur },
      ja: { translation: ja },
      zh: { translation: zh },
    },
    lng: detectInitialLang(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function applyLangSideEffects(code: LangCode) {
  if (typeof document === "undefined") return;
  const meta = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
  document.documentElement.setAttribute("lang", meta.code);
  document.documentElement.setAttribute("dir", meta.dir);
}

/** Map our internal lang codes to Google Translate's expected codes. */
function toGoogleCode(code: LangCode): string {
  if (code === "zh") return "zh-CN";
  return code;
}

/** Set the Google Translate cookie so the whole page renders in `code` after reload. */
function setGoogTransCookie(code: LangCode) {
  if (typeof document === "undefined") return;
  const gcode = toGoogleCode(code);
  const value = code === "en" ? "" : `/en/${gcode}`;
  const host = window.location.hostname;
  const parts = host.split(".");
  const parent = parts.length > 1 ? "." + parts.slice(-2).join(".") : host;
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  const write = (domain?: string) => {
    const base = `googtrans=${value}; path=/; expires=${expires}`;
    document.cookie = domain ? `${base}; domain=${domain}` : base;
  };
  // Clear then set on both host and parent domain.
  document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `googtrans=; path=/; domain=${parent}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  if (code !== "en") {
    write();
    write(parent);
  }
}

/** Try to drive Google Translate in-place without a full page reload. */
function applyGoogleTranslateInPlace(code: LangCode): boolean {
  if (typeof document === "undefined") return false;
  const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
  if (!select) return false;
  // Google's combo uses "" for the source (English) and the target code otherwise.
  const target = code === "en" ? "" : toGoogleCode(code);
  // If the option doesn't exist yet (widget still initializing), bail so caller can fallback.
  const hasOption = Array.from(select.options).some((o) => o.value === target);
  if (!hasOption) return false;
  select.value = target;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function waitForGoogleCombo(timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector("select.goog-te-combo")) return resolve(true);
    const start = Date.now();
    const iv = window.setInterval(() => {
      if (document.querySelector("select.goog-te-combo")) {
        window.clearInterval(iv);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        window.clearInterval(iv);
        resolve(false);
      }
    }, 80);
  });
}

let googleTranslateBooted = false;

function ensureGoogleTranslateWidget() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (googleTranslateBooted) return;
  googleTranslateBooted = true;

  const holder = document.createElement("div");
  holder.id = "google_translate_element";
  holder.style.display = "none";
  document.body.appendChild(holder);

  (window as typeof window & { googleTranslateElementInit?: () => void }).googleTranslateElementInit = () => {
    try {
      const google = (window as typeof window & { google?: { translate?: { TranslateElement?: any } } }).google;
      if (!google?.translate?.TranslateElement) return;
      new google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false, layout: google.translate.TranslateElement.InlineLayout.SIMPLE },
        "google_translate_element",
      );
    } catch {}
  };

  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.head.appendChild(script);
}

export async function changeLanguage(scope: LangScope, code: LangCode) {
  try { window.localStorage.setItem(storageKeyFor(scope), code); } catch {}
  await i18n.changeLanguage(code);
  applyLangSideEffects(code);
  setGoogTransCookie(code);
  if (typeof window === "undefined") return;
  ensureGoogleTranslateWidget();

  // Try in-place switch first (no reload). If Google's widget hasn't mounted yet, wait briefly.
  if (applyGoogleTranslateInPlace(code)) return;
  const ready = await waitForGoogleCombo();
  if (ready && applyGoogleTranslateInPlace(code)) return;

  // Fallback: reload so the cookie takes effect on next paint.
  window.location.reload();
}

// Apply initial dir/lang on module load in browser
if (typeof document !== "undefined") {
  const initialLang = detectInitialLang();
  applyLangSideEffects(initialLang);
  setGoogTransCookie(initialLang);
  const bootTranslator = () => window.setTimeout(() => ensureGoogleTranslateWidget(), 1500);
  if (document.readyState === "complete") bootTranslator();
  else window.addEventListener("load", bootTranslator, { once: true });
}

export default i18n;
