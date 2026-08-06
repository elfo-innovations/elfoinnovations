import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Project = {
  id: string;
  project_name: string;
  client_name: string | null;
  category: string | null;
  description: string | null;
  live_url: string | null;
  github_url: string | null;
  after_image_url: string | null;
  before_image_url: string | null;
  is_featured: boolean;
  technologies: string[];
};

const FEATURED_LINKS = [
  { name: "aabansyed.netlify.app", url: "https://aabansyed.netlify.app", tag: "Personal Portfolio" },
];


export function PortfolioSection() {
  const { data } = useQuery({
    queryKey: ["portfolio_projects_public"],
    queryFn: async () => (await supabase.from("portfolio_projects").select("*").eq("is_active", true).order("sort_order")).data as Project[] | null,
  });

  const items = data ?? [];

  return (
    <section id="portfolio" className="border-t bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">Portfolio</div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Projects we've <span className="electric-text">shipped</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Live products with public code and deployed demos — explore the work directly.
          </p>
        </div>

        {/* Featured personal portfolios */}
        <div className="mx-auto mt-10 grid max-w-xl gap-4">
          {FEATURED_LINKS.map((f) => (
            <a key={f.url} href={f.url} target="_blank" rel="noreferrer"
              className="glass-card group flex items-center justify-between gap-4 rounded-2xl p-5 transition-all hover:electric-glow">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{f.tag}</span>
                </div>
                <div className="mt-2 truncate font-semibold">{f.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">Live · click to open</div>
              </div>
              <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </a>
          ))}
        </div>

        {/* Client projects */}
        {items.length > 0 && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <article key={p.id} className="glass-card overflow-hidden rounded-3xl transition-all hover:electric-glow">
                <div className="aspect-[16/10] overflow-hidden border-b bg-muted">
                  {p.after_image_url || p.before_image_url ? (
                    <img src={(p.after_image_url || p.before_image_url)!} alt={p.project_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center circuit-pattern text-xs uppercase tracking-widest text-muted-foreground">ELFO Project</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {p.category || "Project"}
                    {p.is_featured && <span className="rounded-full bg-primary/10 px-2 py-0.5">Featured</span>}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold">{p.project_name}</h3>
                  {p.client_name && <div className="text-xs text-muted-foreground">for {p.client_name}</div>}
                  {p.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  {p.technologies?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.technologies.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full border bg-card px-2 py-0.5 text-[10px]">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    {p.live_url && (
                      <a href={p.live_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                        <ExternalLink className="h-3 w-3" /> Live
                      </a>
                    )}
                    {p.github_url && (
                      <a href={p.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
                        <Github className="h-3 w-3" /> Code
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
