import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Newspaper, Search, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { stripHtmlTags } from "@/lib/sanitize-html";
import { slugify } from "@/lib/faq-utils";

const SITE_ORIGIN = "https://elfoinnovations.com";
const URL = `${SITE_ORIGIN}/blogs`;
const TITLE = "Software Development Insights, Guides & Technology Blog | ELFO Innovations";
const DESC =
  "Deep-dive articles on custom software development, web and mobile engineering, SaaS architecture, and product strategy from the ELFO Innovations team.";
const PAGE_SIZE = 10;

type BlogSearch = { page: number; category?: string; q?: string };

async function fetchBlogsPage({ page, category, q }: BlogSearch) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let query = supabase.from("blogs").select("*", { count: "exact" }).eq("is_published", true);
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
  const { data, count, error } = await query.order("published_at", { ascending: false }).range(from, to);
  if (error) console.error("[blogs loader] supabase error:", JSON.stringify(error));
  return { posts: data ?? [], total: count ?? 0 };
}

export const Route = createFileRoute("/blogs")({
  validateSearch: (s: Record<string, unknown>): BlogSearch => ({
    page: Math.max(1, Number(s.page) || 1),
    category: typeof s.category === "string" && s.category ? s.category : undefined,
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ page: search.page, category: search.category, q: search.q }),
  loader: async ({ deps }) => fetchBlogsPage(deps),
  head: ({ search }: { search: BlogSearch }) => {
    const isFiltered = !!(search?.q || (search?.page && search.page > 1));
    const canonical = search?.category
      ? `${URL}?category=${encodeURIComponent(search.category)}`
      : URL;
    const title = search?.category ? `${search.category} Articles | ELFO Innovations Blog` : TITLE;
    return {
      meta: [
        { title },
        { name: "description", content: DESC },
        { name: "robots", content: isFiltered ? "noindex,follow" : "index,follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: DESC },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
      ],
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", type: "application/rss+xml", title: "ELFO Innovations Blog RSS Feed", href: `${SITE_ORIGIN}/rss.xml` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://elfoinnovations.com/" },
              { "@type": "ListItem", position: 2, name: "Blog", item: URL },
            ],
          }),
        },
      ],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const loaderData = Route.useLoaderData();
  const { page, category, q } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [searchInput, setSearchInput] = useState(q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data, isLoading } = useQuery({
    queryKey: ["public-blogs", page, category, q],
    queryFn: () => fetchBlogsPage({ page, category, q }),
    initialData: loaderData,
  });

  // All-time category list for the filter pills — deliberately its own query so switching
  // pages/categories doesn't need to re-fetch it every time.
  const { data: categories } = useQuery({
    queryKey: ["public-blog-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blogs")
        .select("category")
        .eq("is_published", true)
        .not("category", "is", null);
      return Array.from(new Set((data ?? []).map((r) => r.category).filter(Boolean))) as string[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => setSearchInput(q ?? ""), [q]);

  const onSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, q: val || undefined, page: 1 }) });
    }, 400);
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const posts = data?.posts ?? [];

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
            Practical essays on frontend craft, backend architecture, cloud, and how we ship
            software that clients approve stage-by-stage.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-full border bg-card py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filter pills */}
        {(categories ?? []).length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/blogs"
              search={{ page: 1 }}
              className="rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition"
            >
              All
            </Link>
            {(categories ?? []).map((c) => (
              <Link
                key={c}
                to="/blogs/category/$category"
                params={{ category: slugify(c) }}
                search={{ page: 1 }}
                className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent/40"
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              {q || category ? "No articles match your filters." : "No articles published yet — check back soon."}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {posts.map((b: Tables<"blogs">) => (
                <Link
                  key={b.id}
                  to="/blogs/$slug"
                  params={{ slug: b.slug }}
                  className="group glass-card block overflow-hidden rounded-2xl transition-all hover:electric-glow"
                >
                  {b.cover_image && (
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={b.cover_image}
                        alt={b.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {b.published_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(b.published_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      {b.reading_minutes ? <span>· {b.reading_minutes} min read</span> : null}
                      {b.category && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                          {b.category}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 font-display text-2xl font-bold tracking-tight group-hover:text-primary">
                      {b.title}
                    </h2>
                    {b.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {stripHtmlTags(b.excerpt)}
                      </p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Link
              to="/blogs"
              search={(prev: BlogSearch) => ({ ...prev, page: Math.max(1, page - 1) })}
              aria-disabled={page <= 1}
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-accent/40"
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1;
              return (
                <Link
                  key={n}
                  to="/blogs"
                  search={(prev: BlogSearch) => ({ ...prev, page: n })}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                    n === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent/40"
                  }`}
                >
                  {n}
                </Link>
              );
            })}
            <Link
              to="/blogs"
              search={(prev: BlogSearch) => ({ ...prev, page: Math.min(totalPages, page + 1) })}
              aria-disabled={page >= totalPages}
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-accent/40"
              }`}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}