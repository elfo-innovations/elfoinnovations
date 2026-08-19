import type { LangCode } from "@/i18n";

type CurrencyConfig = {
  /** ISO currency code, shown only for reference/debugging. */
  code: string;
  /** Symbol/prefix shown before the number. */
  symbol: string;
  /** How many units of this currency equal 1 USD. */
  rateFromUsd: number;
};

/**
 * Approximate market exchange rates (as of Aug 2026).
 * These are static — update periodically (e.g. every few months) so displayed
 * prices don't drift too far from real rates. For always-accurate rates you'd
 * need a live FX API, which isn't wired up here.
 */
export const CURRENCY_BY_LANG: Record<LangCode, CurrencyConfig> = {
  en: { code: "USD", symbol: "$", rateFromUsd: 1 },
  es: { code: "EUR", symbol: "€", rateFromUsd: 0.86 },
  fr: { code: "EUR", symbol: "€", rateFromUsd: 0.86 },
  de: { code: "EUR", symbol: "€", rateFromUsd: 0.86 },
  ar: { code: "SAR", symbol: "﷼", rateFromUsd: 3.75 },
  ur: { code: "PKR", symbol: "Rs ", rateFromUsd: 277.5 },
  ja: { code: "JPY", symbol: "¥", rateFromUsd: 159 },
  zh: { code: "CNY", symbol: "¥", rateFromUsd: 6.74 },
};

/**
 * Takes a stored price string (e.g. "$500", "$1,500", "Custom") and converts
 * the numeric portion into the currency for the given language.
 * Non-numeric prices like "Custom" are returned unchanged.
 */
export function formatPriceForLang(rawPrice: string, lang: LangCode): string {
  const cfg = CURRENCY_BY_LANG[lang] ?? CURRENCY_BY_LANG.en;
  const cleaned = (rawPrice ?? "").replace(/,/g, "");
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  if (!match) return rawPrice; // e.g. "Custom" — nothing to convert

  const usdAmount = parseFloat(match[1]);
  if (Number.isNaN(usdAmount)) return rawPrice;

  const converted = usdAmount * cfg.rateFromUsd;
  const rounded = Math.round(converted);
  const grouped = rounded.toLocaleString("en-US"); // thousands separators

  return `${cfg.symbol}${grouped}`;
}