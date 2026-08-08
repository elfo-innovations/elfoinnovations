import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import beforeAsset from "@/assets/showcase-before-2.png";
import afterAsset from "@/assets/showcase-after-2.png";
import beforeAsset3 from "@/assets/showcase-before-3.png";
import afterAsset3 from "@/assets/showcase-after-3.png";
import beforeAsset4 from "@/assets/showcase-before-4.png";
import afterAsset4 from "@/assets/showcase-after-4.png";
import beforeAsset5 from "@/assets/showcase-before-5.png";
import afterAsset5 from "@/assets/showcase-after-5.png";
import beforeAsset6 from "@/assets/showcase-before-6.png";
import afterAsset6 from "@/assets/showcase-after-6.png";
import beforeAsset7 from "@/assets/showcase-before-7.png";
import afterAsset7 from "@/assets/showcase-after-7.png";
import beforeAsset8 from "@/assets/ace-before.png";
import afterAsset8 from "@/assets/ace-after.png";

type Item = { id: string; title: string; category: string | null; before_image_url: string | null; after_image_url: string | null };

const FEATURED: Item[] = [
  {
    id: "featured-redesign",
    title: "Marketing Site Redesign",
    category: "Web Platform",
    before_image_url: beforeAsset,
    after_image_url: afterAsset,
  },
  {
    id: "featured-redesign-2",
    title: "Agency Landing Refresh",
    category: "Web Platform",
    before_image_url: beforeAsset3,
    after_image_url: afterAsset3,
  },
  {
    id: "featured-redesign-3",
    title: "SEO Platform Revamp",
    category: "Web Platform",
    before_image_url: beforeAsset4,
    after_image_url: afterAsset4,
  },
  {
    id: "featured-redesign-4",
    title: "Landscaping Brand Redesign",
    category: "Web Platform",
    before_image_url: beforeAsset5,
    after_image_url: afterAsset5,
  },
  {
    id: "featured-redesign-5",
    title: "Automotive Brand Redesign",
    category: "Web Platform",
    before_image_url: beforeAsset6,
    after_image_url: afterAsset6,
  },
  {
    id: "featured-redesign-6",
    title: "Gourmet E-Commerce Redesign",
    category: "E-Commerce",
    before_image_url: beforeAsset7,
    after_image_url: afterAsset7,
  },
  {
    id: "featured-redesign-7",
    title: "Hardware Retail Redesign",
    category: "Retail",
    before_image_url: beforeAsset8,
    after_image_url: afterAsset8,
  },
];


const placeholderShot = (label: string, tint: "muted" | "bright" = "muted") => (
  <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${tint === "bright" ? "bg-[var(--gradient-primary)]" : "bg-muted"}`}>
    <div className="absolute inset-0 opacity-30 circuit-pattern" />
    <div className="relative text-center">
      <div className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${tint === "bright" ? "text-white/80" : "text-muted-foreground"}`}>{label}</div>
    </div>
  </div>
);

const FALLBACK: { title: string; cat: string }[] = [
  { title: "Fintech Dashboard", cat: "Web Platform" },
  { title: "E-Commerce Redesign", cat: "E-Commerce" },
  { title: "SaaS Analytics Suite", cat: "Data & AI" },
  { title: "Healthcare Portal", cat: "Enterprise" },
  { title: "Real Estate Marketplace", cat: "Marketplace" },
  { title: "Travel Booking App", cat: "Mobile" },
  { title: "Restaurant Ordering", cat: "Hospitality" },
];

export function BeforeAfterShowcase() {
  const { data } = useQuery({
    queryKey: ["before_after_items"],
    queryFn: async () => (await supabase.from("before_after_items").select("*").eq("is_active", true).order("sort_order")).data as Item[] | null,
  });

  const baseItems = (data ?? []).filter((i) => i.before_image_url && i.after_image_url);
  const featuredIds = new Set(FEATURED.map((f) => f.id));
  const items = [...FEATURED, ...baseItems.filter((i) => !featuredIds.has(i.id))];

  const loop = [...items, ...items];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const speed = 40;
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (!paused && el) {
        el.scrollLeft += speed * dt;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, items.length]);

  return (
    <section className="border-t bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">Before → After</div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Real projects. <span className="electric-text">Real transformations.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every ELFO INNOVATIONS delivery is engineered for measurable improvement — in speed, clarity, and conversion.
          </p>
        </div>
      </div>

      <div
        className="mt-12 relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <div ref={scrollerRef} dir="ltr" className="overflow-x-auto no-scrollbar px-4 sm:px-8 lg:px-12" style={{ scrollbarWidth: "none", direction: "ltr" }}>
          <div className="flex gap-6 pb-4 min-w-max">
            {loop.map((p, i) => (
              <div key={`${p.id}-${i}`} className="w-[85vw] sm:w-[520px] lg:w-[600px] shrink-0">
                <ShowcaseCard
                  name={p.title}
                  category={p.category ?? undefined}
                  before={p.before_image_url ?? undefined}
                  after={p.after_image_url ?? undefined}
                />
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Auto-scrolling — hover to pause</p>
      </div>
    </section>
  );
}

function ShowcaseCard({ name, category, before, after }: { name: string; category?: string; before?: string; after?: string }) {
  return (
    <div className="glass-card group overflow-hidden rounded-3xl p-4 sm:p-5 transition-all hover:electric-glow h-full">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-muted">
          {before ? <img src={before} alt={`${name} — before`} loading="lazy" className="h-full w-full object-cover object-top" /> : placeholderShot("Before")}
          <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">Before</span>
        </div>
        <div className="mx-auto flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground electric-glow rotate-90 sm:rotate-0">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-primary/30 bg-muted">
          {after ? <img src={after} alt={`${name} — after`} loading="lazy" className="h-full w-full object-cover object-top" /> : placeholderShot("After", "bright")}
          <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur">After</span>
        </div>
      </div>
      <div className="mt-4 sm:mt-5 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{name}</div>
          {category && <div className="truncate text-xs text-muted-foreground">{category}</div>}
        </div>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-primary">ELFO</span>
      </div>
    </div>
  );
}
