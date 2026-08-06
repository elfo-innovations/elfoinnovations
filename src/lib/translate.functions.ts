import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  text: z.string().min(1).max(4000),
  target: z.string().min(2).max(8),
});

/**
 * Translate a chat message to the receiver's UI language using the Lovable AI Gateway.
 * Returns { translated, detectedLang } — detectedLang is a best-effort ISO code
 * ("en", "es", "fr", "de", "ar", "ur", "ja", "zh", ...).
 * If the source already matches target, returns the original text and same code.
 */
export const translateMessage = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { translated: data.text, detectedLang: data.target, skipped: true as const };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              'You are a translation engine for a chat app. Detect the source language of the user text and translate it to the target ISO code the user provides. Reply with ONLY strict JSON in the exact shape {"detected":"<iso>","translated":"<text>"} — no prose, no code fences. Preserve emojis, links, numbers, and line breaks. If the source is already the target language, return the original text unchanged with the correct detected code.',
          },
          {
            role: "user",
            content: `Target: ${data.target}\nText:\n${data.text}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return { translated: data.text, detectedLang: data.target, skipped: true as const };
    }

    const json: any = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    try {
      const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        translated: String(parsed.translated ?? data.text),
        detectedLang: String(parsed.detected ?? data.target).toLowerCase().slice(0, 5),
        skipped: false as const,
      };
    } catch {
      return { translated: data.text, detectedLang: data.target, skipped: true as const };
    }
  });
