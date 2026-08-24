import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ArrowLeft, Calendar, ListTree } from "lucide-react";
import type { ReactNode } from "react";
import { sanitizeHtml } from "@/components/web-portal/RichTextEditor";

const SITE = "https://elfoinnovations.com";

export const Route = createFileRoute("/blog_/$slug")({
  head: ({ loaderData, params }: any) => {
    const b = loaderData;
    const url = `${SITE}/blog/${params.slug}`;
    const title =
      b?.meta_title ||
      (b?.title ? `${b.title} | ELFO Innovations Blog` : "Article — ELFO Innovations");
    const desc =
      b?.meta_description || b?.excerpt || "Insights from the ELFO Innovations engineering team.";
    const img = b?.cover_image || undefined;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        ...(img
          ? [
              { property: "og:image", content: img },
              { name: "twitter:image", content: img },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: b
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: b.title,
                description: b.excerpt || desc,
                image: img,
                datePublished: b.published_at,
                dateModified: b.updated_at || b.published_at,
                author: { "@type": "Person", name: b.author_name || "ELFO Innovations" },
                publisher: {
                  "@type": "Organization",
                  name: "ELFO Innovations",
                  logo: { "@type": "ImageObject", url: `${SITE}/favicon.png` },
                },
                mainEntityOfPage: url,
              }),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
                  { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
                  { "@type": "ListItem", position: 3, name: b.title, item: url },
                ],
              }),
            },
          ]
        : [],
    };
  },

  loader: async ({ params }) => {
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) throw notFound();
    return data;
  },
  component: BlogPost,
  errorComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Article unavailable</h1>
        <Link to="/blog" className="mt-4 inline-block text-primary">
          ← Back to blog
        </Link>
      </div>
    </PublicLayout>
  ),
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <Link to="/blog" className="mt-4 inline-block text-primary">
          ← Back to blog
        </Link>
      </div>
    </PublicLayout>
  ),
});

type Heading = { id: string; text: string; level: 2 | 3 };

function headingSlug(text: string, index: number) {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "section"}-${index}`;
}

/** Turns `[label](https://url)` segments into real links, leaving the rest of the text untouched. */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = linkPattern.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a
        key={key++}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function buildContent(md: string): { blocks: ReactNode[]; headings: Heading[] } {
  const blocks: ReactNode[] = [];
  const headings: Heading[] = [];
  const rawBlocks = md.split(/\n{2,}/);
  let headingCounter = 0;

  rawBlocks.forEach((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("##### ")) {
      blocks.push(
        <h5 key={i} className="mt-6 font-display text-base font-bold">
          {renderInline(trimmed.slice(6))}
        </h5>
      );
      return;
    }
    if (trimmed.startsWith("#### ")) {
      blocks.push(
        <h4 key={i} className="mt-7 font-display text-lg font-bold">
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4);
      const id = headingSlug(text, headingCounter++);
      headings.push({ id, text, level: 3 });
      blocks.push(
        <h3 key={i} id={id} className="mt-8 scroll-mt-24 font-display text-xl font-bold">
          {renderInline(text)}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3);
      const id = headingSlug(text, headingCounter++);
      headings.push({ id, text, level: 2 });
      blocks.push(
        <h2 key={i} id={id} className="mt-10 scroll-mt-24 font-display text-2xl font-bold tracking-tight">
          {renderInline(text)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h2 key={i} className="mt-10 font-display text-3xl font-bold tracking-tight">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      return;
    }
    if (/^(-|\*) /.test(trimmed)) {
      blocks.push(
        <ul key={i} className="mt-4 list-disc space-y-1 pl-6 text-muted-foreground">
          {trimmed.split("\n").map((l, j) => (
            <li key={j}>{renderInline(l.replace(/^(-|\*) /, ""))}</li>
          ))}
        </ul>
      );
      return;
    }
    blocks.push(
      <p key={i} className="mt-4 leading-relaxed text-muted-foreground">
        {renderInline(trimmed)}
      </p>
    );
  });

  return { blocks, headings };
}

function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;
  return (
    <nav className="glass-card mt-8 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-sm font-bold">
        <ListTree className="h-4 w-4 text-primary" /> Table of Contents
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "ml-4" : ""}>
            <a href={`#${h.id}`} className="text-muted-foreground hover:text-primary hover:underline">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function formatDateTime(d: Date) {
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function BlogPost() {
  const b = Route.useLoaderData() as any;
  const { data: related } = useQuery({
    queryKey: ["related-blogs", b.id],
    queryFn: async () =>
      (
        await supabase
          .from("blogs")
          .select("id, slug, title, excerpt, cover_image")
          .eq("is_published", true)
          .neq("id", b.id)
          .order("published_at", { ascending: false })
          .limit(3)
      ).data ?? [],
  });

  const hasRichContent = !!b.content_html?.trim();
  const { blocks, headings: mdHeadings } = hasRichContent ? { blocks: [], headings: [] as Heading[] } : buildContent(b.content_md || "");

  const contentRef = useRef<HTMLDivElement>(null);
  const [htmlHeadings, setHtmlHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    if (!hasRichContent || !contentRef.current) return;
    const found: Heading[] = [];
    let counter = 0;
    contentRef.current.querySelectorAll("h2, h3").forEach((el) => {
      const text = el.textContent || "";
      const id = headingSlug(text, counter++);
      el.id = id;
      el.classList.add("scroll-mt-24");
      found.push({ id, text, level: el.tagName === "H2" ? 2 : 3 });
    });
    setHtmlHeadings(found);
  }, [hasRichContent, b.content_html]);

  const headings = hasRichContent ? htmlHeadings : mdHeadings;

  const publishedDate = b.published_at ? new Date(b.published_at) : null;
  const updatedDate = b.updated_at ? new Date(b.updated_at) : null;
  const showUpdated =
    publishedDate && updatedDate && updatedDate.getTime() - publishedDate.getTime() > 60000;

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {b.category && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
              {b.category}
            </span>
          )}
          {publishedDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Published {formatDateTime(publishedDate)}
            </span>
          )}
          {showUpdated && <span>· Last updated {formatDateTime(updatedDate!)}</span>}
          {b.reading_minutes ? <span>· {b.reading_minutes} min read</span> : null}
          <span>· by {b.author_name}</span>
        </div>

        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {b.title}
        </h1>
        {b.excerpt && <p className="mt-4 text-lg text-muted-foreground">{b.excerpt}</p>}

        {b.cover_image && (
          <div className="mt-8 overflow-hidden rounded-2xl border">
            <img src={b.cover_image} alt={b.title} className="w-full object-cover" />
          </div>
        )}

        {b.tldr && (
          <div className="mt-8 rounded-2xl border-l-4 border-primary bg-primary/5 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Quick Answer</div>
            <p className="mt-1.5 leading-relaxed">{b.tldr}</p>
          </div>
        )}

        <TableOfContents headings={headings} />

        {hasRichContent ? (
          <div
            ref={contentRef}
            className="prose prose-neutral mt-8 max-w-none dark:prose-invert [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mt-10 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h4]:mt-7 [&_h4]:text-lg [&_h4]:font-bold [&_h5]:mt-6 [&_h5]:text-base [&_h5]:font-bold [&_img]:rounded-xl [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.content_html) }}
          />
        ) : (
          <div className="mt-8 text-base">{blocks}</div>
        )}

        {(b.tags ?? []).length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {b.tags.map((t: string) => (
              <span
                key={t}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </article>

      {(related ?? []).length > 0 && (
        <section className="border-t bg-muted/20 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold">Keep reading</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {(related ?? []).map((r: any) => (
                <Link
                  key={r.id}
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="glass-card group block overflow-hidden rounded-2xl transition-all hover:electric-glow"
                >
                  {r.cover_image && (
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={r.cover_image}
                        alt={r.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="font-semibold group-hover:text-primary">{r.title}</div>
                    {r.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {r.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}