import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { stripHtmlTags } from "@/lib/sanitize-html";

const SITE = "https://elfoinnovations.com";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await supabase
          .from("blogs")
          .select("slug, title, excerpt, published_at, updated_at, author_name")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(50);

        if (error) console.error("[rss.xml] supabase error:", error.message);

        const items = (data ?? [])
          .map((b) => {
            const url = `${SITE}/blogs/${b.slug}`;
            const pubDate = new Date(b.published_at ?? Date.now()).toUTCString();
            return `  <item>
    <title>${escapeXml(b.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(b.excerpt ? stripHtmlTags(b.excerpt) : "")}</description>
    <author>${escapeXml(b.author_name ?? "ELFO Innovations")}</author>
  </item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>ELFO Innovations Blog</title>
  <link>${SITE}/blogs</link>
  <description>Software development insights, guides, and technology articles from the ELFO Innovations team.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});