import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote } from "lucide-react";

type Review = {
  name: string;
  role: string;
  company: string;
  rating: number;
  text: string;
  initials: string;
};

const REVIEWS: Review[] = [
  {
    name: "Sarah Mitchell",
    role: "Founder",
    company: "Adcology",
    rating: 5,
    text: "ELFO rebuilt our entire marketing site in weeks. Conversions jumped 3x and the design finally matches the quality of our service. Best decision we made this year.",
    initials: "SM",
  },
  {
    name: "David Chen",
    role: "CEO",
    company: "MWT Wireless",
    rating: 5,
    text: "They delivered the platform before we even paid a cent. The trust factor was unmatched — and the final product is genuinely premium. Highly recommend.",
    initials: "DC",
  },
  {
    name: "Priya Sharma",
    role: "Product Lead",
    company: "Moz Labs",
    rating: 5,
    text: "Every deadline was hit, every stage was transparent. The 4-stage workflow gave us total confidence. Their engineers think like founders.",
    initials: "PS",
  },
  {
    name: "James O'Connor",
    role: "Owner",
    company: "Lawnella",
    rating: 5,
    text: "From a dated green template to a stunning premium brand experience. Bookings are up, calls are up, everything is up. ELFO just gets it.",
    initials: "JO",
  },
  {
    name: "Marco Rossi",
    role: "Director",
    company: "Cargotec Motors",
    rating: 5,
    text: "Pure craftsmanship. Fast, aggressive, and beautifully engineered — exactly like the cars we sell. Our new site closes deals for us now.",
    initials: "MR",
  },
  {
    name: "Emily Watson",
    role: "Marketing Head",
    company: "The Virginia Shop",
    rating: 5,
    text: "The luxury redesign completely repositioned our brand. Average order value doubled within 60 days. ELFO delivered beyond every expectation.",
    initials: "EW",
  },
  {
    name: "Rahul Verma",
    role: "COO",
    company: "Ace Retail Group",
    rating: 5,
    text: "Enterprise-grade delivery, startup-level speed. Their team communicated daily, shipped weekly, and the outcome speaks for itself. Truly world-class.",
    initials: "RV",
  },
];

export function ReviewsScroller() {
  const { data: dbReviews } = useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () =>
      (await supabase
        .from("client_reviews")
        .select("client_name,company,title,message,rating")
        .eq("status", "approved")
        .eq("allow_public", true)
        .order("reviewed_at", { ascending: false })
        .limit(20)).data ?? [],
  });
  const dbMapped: Review[] = (dbReviews ?? []).map((r: any) => ({
    name: r.client_name,
    role: "Client",
    company: r.company || "Elfo Innovations",
    rating: r.rating,
    text: r.message,
    initials: (r.client_name || "C").split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase(),
  }));
  const base = [...dbMapped, ...REVIEWS];
  const loop = [...base, ...base];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const speed = 35;
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
  }, [paused]);

  return (
    <section className="border-t bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">Our Client Reviews</div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Trusted by <span className="electric-text">founders worldwide.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real words from real clients we've built and shipped for.
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
            {loop.map((r, i) => (
              <div key={`${r.name}-${i}`} className="w-[85vw] sm:w-[420px] lg:w-[460px] shrink-0">
                <ReviewCard review={r} />
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Auto-scrolling — hover to pause</p>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="glass-card group h-full overflow-hidden rounded-3xl p-6 sm:p-7 transition-all hover:electric-glow">
      <div className="flex items-start justify-between">
        <div className="flex gap-0.5">
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
          ))}
        </div>
        <Quote className="h-6 w-6 text-primary/40" />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-foreground/90 sm:text-base">"{review.text}"</p>
      <div className="mt-6 flex items-center gap-3 border-t pt-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--gradient-primary)] text-sm font-bold text-primary-foreground">
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{review.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {review.role} · {review.company}
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-primary">ELFO</span>
      </div>
    </div>
  );
}
