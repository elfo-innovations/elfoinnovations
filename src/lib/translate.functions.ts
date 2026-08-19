import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  text: z.string().min(1).max(4000),
  target: z.string().min(2).max(8),
});

/**
 * Translate a chat message to the receiver's UI language — 100% FREE,
 * no API key or signup required.
 *
 * Primary:  Google Translate's public endpoint (same one Google's own
 *           "Translate this page" widget uses). No key needed.
 * Fallback: MyMemory's free translation API, used only if Google's
 *           endpoint is unreachable or rate-limited, so translation
 *           keeps working either way.
 *
 * Returns { translated, detectedLang } — detectedLang is a best-effort
 * ISO code ("en", "es", "fr", "de", "ar", "ur", "ja", "zh", ...).
 */
export const translateMessage = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const target = data.target.slice(0, 2).toLowerCase();

    // ---------- Primary: Google Translate public endpoint (free, no key) ----------
    try {
      const url =
        `https://translate.googleapis.com/translate_a/single` +
        `?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(data.text)}`;

      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ElfoInnovationsChat/1.0)" },
      });

      if (res.ok) {
        const json: any = await res.json();
        // Shape: [ [ [translatedChunk, originalChunk, ...], ... ], null, "detectedSourceLang", ... ]
        const chunks = Array.isArray(json?.[0]) ? json[0] : [];
        const translated = chunks.map((c: any) => c?.[0] ?? "").join("").trim();
        const detected = typeof json?.[2] === "string" ? json[2] : target;

        if (translated) {
          return { translated, detectedLang: detected.toLowerCase().slice(0, 5), skipped: false as const };
        }
      }
    } catch {
      // fall through to the backup provider below
    }

    // ---------- Fallback: MyMemory (also free, no key) ----------
    try {
      const url =
        `https://api.mymemory.translated.net/get` +
        `?q=${encodeURIComponent(data.text)}&langpair=${encodeURIComponent(`autodetect|${target}`)}`;

      const res = await fetch(url);
      if (res.ok) {
        const json: any = await res.json();
        const translated: string | undefined = json?.responseData?.translatedText;
        const detected: string | undefined = json?.responseData?.detectedLanguage || json?.matches?.[0]?.source;

        if (translated && translated.trim()) {
          return {
            translated: translated.trim(),
            detectedLang: (detected || target).toLowerCase().slice(0, 5),
            skipped: false as const,
          };
        }
      }
    } catch {
      // both providers failed — fall through to returning the original text
    }

    // ---------- Both providers unavailable: don't break the chat, just skip ----------
    return { translated: data.text, detectedLang: target, skipped: true as const };
  });