import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ArrowRight, Calendar, Newspaper } from "lucide-react";

const URL = "https://elfoinnovations.com/blog";
const TITLE = "Software Development Insights, Guides & Technology Blog | ELFO Innovations";
const DESC = "Deep-dive articles on custom software development, web and mobile engineering, SaaS architecture, and product strategy from the ELFO Innovations team.";

export const Route = createFileRoute("/blog")({
  loader: async () => {
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    return data ?? [];
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://elfoinnovations.com/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: URL },
        ],
      }),
    }],
  }),
  component: BlogIndex,
});


function BlogIndex() {
  const loaderData = Route.useLoaderData() as any[];
  const { data, isLoading } = useQuery({
    queryKey: ["public-blogs"],
    queryFn: async () =>
      (await supabase.from("blogs").select("*").eq("is_published", true).order("published_at", { ascending: false })).data ?? [],
    initialData: loaderData,
  });

  return (
    <PublicLayout>
      <section className="border-b bg-hero-radial">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
            <Newspaper className="h-3.5 w-3.5 text-primary" /> ELFO Journal
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Notes from the <span className="electric-text">build room.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Practical essays on frontend craft, backend architecture, cloud, and how we ship software that clients approve stage-by-stage.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No articles published yet — check back soon.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {(data ?? []).map((b: any) => (
              <Link key={b.id} to="/blog/$slug" params={{ slug: b.slug }} className="group glass-card block overflow-hidden rounded-2xl transition-all hover:electric-glow">
                {b.cover_image && (
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img src={b.cover_image} alt={b.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {b.published_at && (
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />
                        {new Date(b.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    )}
                    {b.reading_minutes ? <span>· {b.reading_minutes} min read</span> : null}
                    {(b.tags ?? []).slice(0, 2).map((t: string) => (
                      <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">{t}</span>
                    ))}
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight group-hover:text-primary">{b.title}</h2>
                  {b.excerpt && <p className="mt-2 text-sm text-muted-foreground">{b.excerpt}</p>}
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
