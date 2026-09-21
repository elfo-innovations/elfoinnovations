import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  media_type: "image" | "video";
  cta_label: string | null;
  cta_href: string | null;
  accent_color: string | null;
};

/** Picks black or white text based on the background's perceived brightness. */
function contrastText(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#ffffff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0a0a0a" : "#ffffff";
}

/** Lightens a #rrggbb hex color toward white by the given 0–1 amount. */
function lighten(hex: string, amount: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function PromoHeroSlider({ theme }: { theme: "light" | "dark" }) {
  const { data } = useQuery({
    queryKey: ["promo_banners", "hero_slider"],
    queryFn: async () =>
      (
        await supabase
          .from("promo_banners")
          .select("*")
          .eq("position", "hero_slider")
          .eq("is_active", true)
          .order("sort_order")
      ).data as Slide[] | null,
  });

  const slides = data ?? [];
  const [active, setActive] = useState(0);
  const isDark = theme === "dark";

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  // Sync the navbar/site background color to whichever slide is currently showing —
  // this overrides the static site-wide background color (if any) while the hero
  // slider is on screen, and reverts automatically the moment it unmounts.
  const currentAccent = slides[Math.min(active, Math.max(slides.length - 1, 0))]?.accent_color;
  useEffect(() => {
    const root = document.documentElement;
    if (currentAccent) {
      root.style.setProperty("--background", currentAccent);
      root.style.setProperty("--card", lighten(currentAccent, 0.08));
      root.style.setProperty("--foreground", contrastText(currentAccent));
    }
    return () => {
      root.style.removeProperty("--background");
      root.style.removeProperty("--card");
      root.style.removeProperty("--foreground");
    };
  }, [currentAccent]);

  if (slides.length < 4) return null;
  const slide = slides[Math.min(active, slides.length - 1)];

  return (
    <section
      className="relative w-full overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: slide.accent_color || undefined }}
    >
      <div
        className={`relative aspect-[16/9] w-full sm:aspect-[21/9] ${!slide.accent_color ? (isDark ? "bg-[#050914]" : "bg-muted") : ""}`}
      >
        {slide.media_type === "video" ? (
          <video
            key={slide.id}
            src={slide.image_url || undefined}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            key={slide.id}
            src={slide.image_url || undefined}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div
          className={`absolute inset-0 ${isDark ? "bg-gradient-to-t from-black/70 via-black/10 to-transparent" : "bg-gradient-to-t from-black/40 via-transparent to-transparent"}`}
        />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          {slide.title && (
            <h2 className="font-display text-2xl font-bold text-white drop-shadow sm:text-4xl">
              {slide.title}
            </h2>
          )}
          {slide.description && (
            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">{slide.description}</p>
          )}
          {slide.cta_label && slide.cta_href && (
            <Link to={slide.cta_href}>
              <Button className="mt-4 rounded-full">{slide.cta_label}</Button>
            </Link>
          )}
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + slides.length) % slides.length)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur transition hover:bg-black/60 sm:left-5 sm:h-12 sm:w-12"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % slides.length)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur transition hover:bg-black/60 sm:right-5 sm:h-12 sm:w-12"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActive(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
