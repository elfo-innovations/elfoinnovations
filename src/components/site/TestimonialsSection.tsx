import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 7000;

type Testimonial = {
  id: string;
  client_name: string;
  company: string | null;
  profile_image_url: string | null;
  project_name: string | null;
  rating: number;
  review: string;
};

function Avatar({ t, className }: { t: Testimonial; className?: string }) {
  return t.profile_image_url ? (
    <img
      src={t.profile_image_url}
      alt=""
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  ) : (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary",
        className,
      )}
    >
      {t.client_name.trim()[0]?.toUpperCase()}
    </div>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            i < value ? "fill-primary text-primary" : "fill-transparent text-muted-foreground/30",
            className,
          )}
        />
      ))}
    </div>
  );
}

/**
 * "Client stories" spotlight: one large featured quote with a client picker beside it
 * (a vertical list on desktop, a swipeable strip on mobile). Deliberately a different
 * pattern from the auto-scrolling card rail used by ReviewsScroller.
 */
export function TestimonialsSection() {
  const { data } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () =>
      (await supabase.from("testimonials").select("*").eq("is_approved", true).order("sort_order"))
        .data,
  });
  const items = (data ?? []) as Testimonial[];

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keep the index valid if the approved list shrinks (admin un-approves a review).
  const current = items.length ? Math.min(active, items.length - 1) : 0;
  const t = items[current];

  const go = (dir: 1 | -1) =>
    setActive((i) => (Math.min(i, items.length - 1) + dir + items.length) % items.length);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % items.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [items.length, paused, current]);

  // Scroll the picker itself (never the page) so the active client stays in view.
  useEffect(() => {
    const list = listRef.current;
    const btn = tabRefs.current[current];
    if (!list || !btn) return;
    if (list.scrollHeight > list.clientHeight + 1) {
      list.scrollTo({
        top: btn.offsetTop - (list.clientHeight - btn.clientHeight) / 2,
        behavior: "smooth",
      });
    }
    if (list.scrollWidth > list.clientWidth + 1) {
      list.scrollTo({
        left: btn.offsetLeft - (list.clientWidth - btn.clientWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [current]);

  const average = items.length ? items.reduce((sum, x) => sum + x.rating, 0) / items.length : 0;

  return (
    <section className="relative overflow-hidden border-t bg-muted/20 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-[110px]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Trusted by <span className="electric-text">ambitious teams.</span>
          </h2>
          {items.length > 0 && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm">
              <Stars value={Math.round(average)} className="h-4 w-4" />
              <span className="font-semibold">{average.toFixed(1)}</span>
              <span className="text-muted-foreground">
                from {items.length} client {items.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>

        {items.length === 0 || !t ? (
          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Client stories will appear here as reviews are approved.
          </div>
        ) : (
          <div
            className="mt-12 grid gap-6 lg:grid-cols-12 lg:gap-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {/* Featured quote */}
            <div
              role="tabpanel"
              id="testimonial-panel"
              aria-labelledby={`testimonial-tab-${current}`}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-10",
                items.length > 1 ? "lg:col-span-7" : "mx-auto max-w-3xl lg:col-span-12",
              )}
            >
              <Quote
                aria-hidden
                className="absolute right-6 top-6 h-16 w-16 text-primary/10 sm:right-10 sm:top-8 sm:h-24 sm:w-24"
              />
              <div
                key={t.id}
                className="relative flex flex-1 flex-col animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <Stars value={t.rating} className="h-5 w-5" />
                <blockquote className="mt-6 flex-1 text-lg font-medium leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
                  “{t.review}”
                </blockquote>
                <div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-6">
                  <Avatar t={t} className="h-14 w-14 text-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-lg font-semibold">
                      {t.client_name}
                    </div>
                    {t.company && (
                      <div className="truncate text-sm text-muted-foreground">{t.company}</div>
                    )}
                  </div>
                  {t.project_name && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {t.project_name}
                    </span>
                  )}
                </div>
              </div>

              {items.length > 1 && (
                <div className="relative mt-6 flex items-center justify-between">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {String(current + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Previous review"
                      className="flex h-10 w-10 items-center justify-center rounded-full border bg-background transition hover:border-primary hover:text-primary"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="Next review"
                      className="flex h-10 w-10 items-center justify-center rounded-full border bg-background transition hover:border-primary hover:text-primary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Client picker: swipeable strip on mobile, vertical list on desktop */}
            {items.length > 1 && (
              <div
                ref={listRef}
                role="tablist"
                aria-label="Choose a client review"
                className="relative -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:col-span-5 lg:mx-0 lg:max-h-[30rem] lg:snap-none lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:px-0 lg:pb-0 lg:pr-1"
              >
                {items.map((x, i) => {
                  const isActive = i === current;
                  return (
                    <button
                      key={x.id}
                      ref={(el) => {
                        tabRefs.current[i] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`testimonial-tab-${i}`}
                      aria-selected={isActive}
                      aria-controls="testimonial-panel"
                      onClick={() => setActive(i)}
                      className={cn(
                        "group flex w-64 shrink-0 snap-start items-center gap-3 rounded-2xl border p-4 text-left transition lg:w-full",
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "bg-card hover:border-primary/40 hover:bg-accent/30",
                      )}
                    >
                      <Avatar t={x} className="h-11 w-11 text-base" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{x.client_name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {x.company || x.project_name || "Client"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold tabular-nums text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {x.rating}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
