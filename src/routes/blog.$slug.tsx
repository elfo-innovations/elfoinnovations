import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ArrowLeft, Calendar } from "lucide-react";

const SITE = "https://elfoinnovations.com";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ loaderData, params }: any) => {
    const b = loaderData;
    const url = `${SITE}/blog/${params.slug}`;
    const title = b?.meta_title || (b?.title ? `${b.title} | ELFO Innovations Blog` : "Article — ELFO Innovations");
    const desc = b?.meta_description || b?.excerpt || "Insights from the ELFO Innovations engineering team.";
    const img = b?.cover_image || undefined;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: b ? [
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
            publisher: { "@type": "Organization", name: "ELFO Innovations", logo: { "@type": "ImageObject", url: `${SITE}/favicon.png` } },
            mainEntityOfPage: url,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org", "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
              { "@type": "ListItem", position: 3, name: b.title, item: url },
            ],
          }),
        },
      ] : [],
    };
  },

  loader: async ({ params }) => {
    const { data } = await supabase.from("blogs").select("*").eq("slug", params.slug).eq("is_published", true).maybeSingle();
    if (!data) throw notFound();
    return data;
  },
  component: BlogPost,
  errorComponent: () => <PublicLayout><div className="mx-auto max-w-2xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Article unavailable</h1><Link to="/blog" className="mt-4 inline-block text-primary">← Back to blog</Link></div></PublicLayout>,
  notFoundComponent: () => <PublicLayout><div className="mx-auto max-w-2xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Article not found</h1><Link to="/blog" className="mt-4 inline-block text-primary">← Back to blog</Link></div></PublicLayout>,
});

function renderContent(md: string) {
  // Minimal renderer: split on blank lines, support # / ## / ### headings and simple lists.
  const blocks = md.split(/\n{2,}/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("### ")) return <h3 key={i} className="mt-8 font-display text-xl font-bold">{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith("## ")) return <h2 key={i} className="mt-10 font-display text-2xl font-bold tracking-tight">{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith("# ")) return <h2 key={i} className="mt-10 font-display text-3xl font-bold tracking-tight">{trimmed.slice(2)}</h2>;
    if (/^(-|\*) /.test(trimmed)) {
      return <ul key={i} className="mt-4 list-disc space-y-1 pl-6 text-muted-foreground">{trimmed.split("\n").map((l, j) => <li key={j}>{l.replace(/^(-|\*) /, "")}</li>)}</ul>;
    }
    return <p key={i} className="mt-4 leading-relaxed text-muted-foreground">{trimmed}</p>;
  });
}

function BlogPost() {
  const b = Route.useLoaderData() as any;
  const { data: related } = useQuery({
    queryKey: ["related-blogs", b.id],
    queryFn: async () =>
      (await supabase.from("blogs").select("id, slug, title, excerpt, cover_image").eq("is_published", true).neq("id", b.id).order("published_at", { ascending: false }).limit(3)).data ?? [],
  });

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {b.published_at && (
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />
              {new Date(b.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          )}
          {b.reading_minutes ? <span>· {b.reading_minutes} min read</span> : null}
          <span>· by {b.author_name}</span>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{b.title}</h1>
        {b.excerpt && <p className="mt-4 text-lg text-muted-foreground">{b.excerpt}</p>}
        {b.cover_image && (
          <div className="mt-8 overflow-hidden rounded-2xl border">
            <img src={b.cover_image} alt={b.title} className="w-full object-cover" />
          </div>
        )}
        <div className="mt-8 text-base">{renderContent(b.content_md || "")}</div>
        {(b.tags ?? []).length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {b.tags.map((t: string) => (
              <span key={t} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">{t}</span>
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
                <Link key={r.id} to="/blog/$slug" params={{ slug: r.slug }} className="glass-card block rounded-2xl p-5 hover:electric-glow">
                  <div className="font-semibold group-hover:text-primary">{r.title}</div>
                  {r.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{r.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
