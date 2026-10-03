import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { stripHtmlTags } from "@/lib/sanitize-html";
import { slugify } from "@/lib/faq-utils";

const SITE = "https://elfoinnovations.com";
const PAGE_SIZE = 10;

type ArchiveSearch = { page: number };

// Category names are free text (admins can add new ones), so the URL slug is derived from
// the name and matched back against the distinct published categories.
async function loadArchive(categorySlug: string, page: number) {
  const { data: catRows } = await supabase
    .from("blogs")
    .select("category")
    .eq("is_published", true)
    .not("category", "is", null);
  const names = Array.from(
    new Set((catRows ?? []).map((r) => r.category).filter(Boolean)),
  ) as string[];
  const name = names.find((n) => slugify(n) === categorySlug);
  if (!name) {
    // A renamed category keeps its old URL alive as a 301 to the current one, instead of
    // 404ing and throwing away whatever ranking/backlinks the old URL had.
    const { data: currentName } = await supabase.rpc("resolve_blog_category_redirect", {
      p_old_slug: categorySlug,
    });
    const target = currentName ? slugify(currentName) : "";
    if (target && target !== categorySlug && names.some((n) => slugify(n) === target)) {
      throw redirect({
        to: "/blogs/category/$category",
        params: { category: target },
        search: { page },
        statusCode: 301,
      });
    }
    throw notFound();
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from("blogs")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .eq("category", name)
    .order("published_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return { name, posts: data ?? [], total: count ?? 0 };
}

export const Route = createFileRoute("/blogs_/category/$category")({
  validateSearch: (s: Record<string, unknown>): ArchiveSearch => ({
    page: Math.max(1, Number(s.page) || 1),
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ params, deps }) => loadArchive(params.category, deps.page),
  head: (ctx) => {
    const { loaderData, params } = ctx;
    const search = ctx.match.search as ArchiveSearch;
    const name = loaderData?.name ?? "Category";
    const url = `${SITE}/blogs/category/${params.category}`;
    const title = `${name} Articles | ELFO Innovations Blog`;
    const desc = `Articles about ${name} from the ELFO Innovations engineering team.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: search?.page > 1 ? "noindex,follow" : "index,follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blogs` },
              { "@type": "ListItem", position: 3, name, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-3xl font-bold">Category not found</h1>
        <Link
          to="/blogs"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all articles
        </Link>
      </div>
    </PublicLayout>
  ),
  component: CategoryArchive,
});

function CategoryArchive() {
  const loaderData = Route.useLoaderData();
  const { category } = Route.useParams();
  const { page } = Route.useSearch();

  const { data } = useQuery({
    queryKey: ["blog-category", category, page],
    queryFn: () => loadArchive(category, page),
    initialData: loaderData,
  });

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <PublicLayout>
      <section className="border-b bg-hero-radial">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="electric-text">{data.name}</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            {data.total} article{data.total === 1 ? "" : "s"} in this category
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {data.posts.map((b: Tables<"blogs">) => (
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
                    alt={b.cover_image_alt || b.title}
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
                  Read article{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Link
              to="/blogs/category/$category"
              params={{ category }}
              search={{ page: Math.max(1, page - 1) }}
              aria-disabled={page <= 1}
              aria-label="Previous page"
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-accent/40"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Link
                key={i}
                to="/blogs/category/$category"
                params={{ category }}
                search={{ page: i + 1 }}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                  i + 1 === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-accent/40"
                }`}
              >
                {i + 1}
              </Link>
            ))}
            <Link
              to="/blogs/category/$category"
              params={{ category }}
              search={{ page: Math.min(totalPages, page + 1) }}
              aria-disabled={page >= totalPages}
              aria-label="Next page"
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-accent/40"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
