import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Github,
  Bot,
  Code2,
  Smartphone,
  Palette,
  Sparkles,
  Megaphone,
  Cloud,
  Building2,
  ShoppingBag,
  Puzzle,
  Database,
  Server,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { useInquiry } from "@/hooks/use-inquiry";
import { cn } from "@/lib/utils";
import { useEdgeColors } from "@/lib/image-edge-colors";

/**
 * Configurable brand constants — replace when the real assets/URL are ready.
 */
export const GITHUB_REPO_URL = "https://github.com/elfo-innovations";

const ICONS: Record<string, LucideIcon> = {
  Bot,
  Code2,
  Smartphone,
  Palette,
  Sparkles,
  Megaphone,
  Cloud,
  Building2,
  ShoppingBag,
  Puzzle,
  Database,
  Server,
  LifeBuoy,
};

// Shown only if no services are configured yet in /admin/web-portal?tab=services,
// so the page never looks broken/empty for a first-time setup.
// Typed loosely because the layout columns are added by migrations that may
// not have been reflected into the generated Supabase types yet.
const DEFAULTS: any[] = [
  {
    id: "default-1",
    title: "AI Automation",
    description: "Agents, copilots and workflow automation that remove busywork and compound your team's output.",
    icon: "Bot",
    image_url: null,
    image_display_mode: "full",
    image_fit: "auto",
    show_text: true,
    cta_label: null,
    cta_href: null,
  },
  {
    id: "default-2",
    title: "Web Development",
    description: "Blazing-fast, accessible web platforms engineered on modern stacks and built to scale.",
    icon: "Code2",
    image_url: null,
    image_display_mode: "full",
    image_fit: "auto",
    show_text: true,
    cta_label: null,
    cta_href: null,
  },
  {
    id: "default-3",
    title: "Mobile Apps",
    description: "Native-feeling iOS and Android products with offline-first architecture and buttery motion.",
    icon: "Smartphone",
    image_url: null,
    image_display_mode: "full",
    image_fit: "auto",
    show_text: true,
    cta_label: null,
    cta_href: null,
  },
  {
    id: "default-4",
    title: "UI/UX Design",
    description: "Interface systems with luxury typography, deliberate spacing and conversion-first flows.",
    icon: "Palette",
    image_url: null,
    image_display_mode: "full",
    image_fit: "auto",
    show_text: true,
    cta_label: null,
    cta_href: null,
  },
];

type Layout = "classic" | "half" | "full" | "imageOnly";

const isExternal = (href: string) => /^https?:\/\//i.test(href);

/** Internal paths use the router; full URLs open in a new tab. */
function CardLink({
  href,
  className,
  label,
  children,
}: {
  href: string;
  className?: string;
  label?: string;
  children?: React.ReactNode;
}) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href as any} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

/** CSS gradient stops placed at the centre of each sampled segment. */
const stops = (cols: string[]) =>
  cols.map((c, i) => `${c} ${(((i + 0.5) / cols.length) * 100).toFixed(1)}%`).join(", ");

/**
 * Card image.
 *  - "cover"   fills the area (edges may crop).
 *  - "contain" always shows the WHOLE image. The leftover space around it is
 *    filled with the image's own edge colours, so the picture looks like it
 *    continues to the edges of the frame. If the browser can't read the image
 *    colours, it falls back to a soft blurred copy of the picture.
 */
function CardImage({ src, alt, fit }: { src: string; alt: string; fit: "cover" | "contain" }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const edges = useEdgeColors(fit === "contain" ? src : null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || fit !== "contain") return;
    const ro = new ResizeObserver(([entry]) =>
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  if (fit === "cover") {
    return (
      <div className="absolute inset-0">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  // Container wider than the image -> the image is limited by height -> gaps on the left/right.
  const gapsOnSides = !!(box && edges && box.w / box.h > edges.ratio);

  return (
    <div ref={boxRef} className="absolute inset-0">
      {edges && box ? (
        gapsOnSides ? (
          <>
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/2"
              style={{ background: `linear-gradient(to bottom, ${stops(edges.left)})` }}
            />
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 w-1/2"
              style={{ background: `linear-gradient(to bottom, ${stops(edges.right)})` }}
            />
          </>
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1/2"
              style={{ background: `linear-gradient(to right, ${stops(edges.top)})` }}
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{ background: `linear-gradient(to right, ${stops(edges.bottom)})` }}
            />
          </>
        )
      ) : (
        <img
          src={src}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}

/** Magnetic, glowing CTA used across the story cards. */
function MagneticCta({ label, onClick, href }: { label: string; onClick?: () => void; href?: string | null }) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };

  const btn = (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="group/cta relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-[transform,box-shadow] duration-300 ease-out electric-glow hover:shadow-2xl"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/25 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full" />
      <span className="relative">{label}</span>
      <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
    </button>
  );

  // A link set from the admin navigates directly; otherwise it opens the inquiry modal.
  if (href) return <CardLink href={href}>{btn}</CardLink>;
  return btn;
}

export function ServicesScrollStory() {
  const { open } = useInquiry();
  const rootRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["services", "scroll-story"],
    queryFn: async () =>
      (
        await supabase
          .from("services")
          .select("*")
          .eq("is_active", true)
          .eq("show_in_story", true)
          .order("sort_order")
      ).data,
  });
  const CARDS = (data && data.length > 0 ? data : DEFAULTS) as any[];

  // GSAP ScrollTrigger: pin the stage and stack cards cinematically.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-story-card]");
        const stage = root.querySelector<HTMLElement>("[data-story-stage]");
        if (!stage || cards.length === 0) return;

        // Reveal of headline + intro copy
        gsap.from("[data-story-reveal]", {
          y: 40,
          opacity: 0,
          filter: "blur(10px)",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root, start: "top 75%" },
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${(cards.length - 1) * window.innerHeight}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        cards.forEach((card, i) => {
          if (i === 0) return;
          const prev = cards[i - 1];
          tl.fromTo(
            card,
            { yPercent: 100, opacity: 1 },
            { yPercent: 0, ease: "power2.inOut", duration: 1 },
            i - 1,
          ).to(
            prev,
            { scale: 0.95, opacity: 0.55, filter: "blur(2px)", ease: "power2.inOut", duration: 1 },
            i - 1,
          );
        });
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [CARDS.length]);

  return (
    <section
      ref={rootRef}
      id="services-story"
      aria-labelledby="services-story-heading"
      className="relative overflow-hidden border-t bg-background"
    >
      {/* Ambient background: grid + floating glow orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-40 circuit-pattern" />
        <div className="absolute -left-24 top-1/4 h-[380px] w-[380px] rounded-full bg-primary/20 blur-[130px]" />
        <div className="absolute -right-20 bottom-1/4 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[140px]" />
      </div>

      {/* Intro */}
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div
              data-story-reveal
              className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" /> What we do
            </div>
            <h2
              id="services-story-heading"
              data-story-reveal
              className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
            >
              Six disciplines. <span className="electric-text">One studio.</span>
            </h2>
            <p data-story-reveal className="mt-5 max-w-xl text-lg text-muted-foreground">
              Scroll through the work we do — each capability engineered end to end, shipped with
              the polish of a product team, not an outsourcing shop.
            </p>
          </div>

          <a
            data-story-reveal
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-5 py-2.5 text-sm font-semibold backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:electric-glow"
          >
            <Github className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            View Source
            <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </a>
        </div>
      </div>

      {/* Pinned stacked-card stage */}
      <div
        data-story-stage
        className="relative mt-14 flex h-screen items-center justify-center px-4 sm:px-6 lg:px-8"
      >
        <div className="relative mx-auto h-[74vh] w-full max-w-6xl overflow-hidden rounded-[32px]">
          {CARDS.map((c, i) => {
            const Icon = (c.icon && ICONS[c.icon]) || Code2;
            const n = String(i + 1).padStart(2, "0");

            // ---- Work out how this card should be laid out ----
            const hasImage = !!c.image_url;
            const showText = c.show_text !== false;
            // classic   : no image yet -> text + gradient placeholder
            // half      : image covers the right half of the card, text on the left
            // full      : image covers the whole card, text sits on top of it
            // imageOnly : text hidden -> the image is the whole card
            const layout: Layout = !hasImage
              ? "classic"
              : !showText
                ? "imageOnly"
                : c.image_display_mode === "half"
                  ? "half"
                  : "full";
            const fitPref = c.image_fit === "contain" || c.image_fit === "cover" ? c.image_fit : "auto";
            const fit: "cover" | "contain" =
              fitPref === "auto" ? (layout === "half" ? "contain" : "cover") : fitPref;
            const onImage = layout === "full";

            return (
              <article
                key={c.id ?? i}
                data-story-card
                style={{ zIndex: i + 1, willChange: "transform, opacity" }}
                className={cn(
                  "glass-card absolute inset-0 grid overflow-hidden rounded-[32px] border shadow-2xl",
                  "grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1",
                )}
              >
                {/* Whole-card image (full + image-only layouts) */}
                {(layout === "full" || layout === "imageOnly") && (
                  <div className="absolute inset-0">
                    <CardImage src={c.image_url} alt={`${c.title} at ELFO Innovations`} fit={fit} />
                    {layout === "full" && (
                      // Dark scrim so the text on top stays readable on any picture.
                      <div className="absolute inset-0 bg-black/55 lg:bg-transparent lg:bg-gradient-to-r lg:from-black/80 lg:via-black/45 lg:to-transparent" />
                    )}
                  </div>
                )}

                {/* Copy */}
                {layout !== "imageOnly" && (
                  <div
                    className={cn(
                      "relative z-10 flex flex-col justify-center gap-5 p-7 sm:p-10 lg:p-14",
                      (layout === "classic" || layout === "full") && "row-span-2 lg:row-span-1",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl",
                        onImage ? "bg-white/15 text-white backdrop-blur" : "bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3
                      className={cn(
                        "font-display text-3xl font-bold tracking-tight sm:text-5xl",
                        onImage && "text-white drop-shadow-lg",
                      )}
                    >
                      {c.title}
                    </h3>
                    <p
                      className={cn(
                        "max-w-md text-base leading-relaxed sm:text-lg",
                        onImage ? "text-white/85" : "text-muted-foreground",
                      )}
                    >
                      {c.description}
                    </p>
                    <div className="pt-1">
                      <MagneticCta
                        label={c.cta_label || "Start a project"}
                        href={c.cta_href}
                        onClick={c.cta_href ? undefined : open}
                      />
                    </div>
                  </div>
                )}

                {/* Right-hand visual (placeholder when there is no image, or the half-card image) */}
                {(layout === "classic" || layout === "half") && (
                  <div
                    className={cn(
                      "relative overflow-hidden",
                      layout === "half" ? "min-h-[200px]" : "hidden lg:block",
                    )}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/35"
                    >
                      <div className="absolute inset-0 opacity-50 circuit-pattern" />
                      <div className="absolute -right-10 top-1/3 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
                      {layout === "classic" && (
                        <div className="absolute bottom-8 left-8 text-[11px] uppercase tracking-[0.3em] text-foreground/40">
                          Image placeholder
                        </div>
                      )}
                    </div>
                    {layout === "half" && (
                      <CardImage src={c.image_url} alt={`${c.title} at ELFO Innovations`} fit={fit} />
                    )}
                  </div>
                )}

                {/* Image-only card: optional link over the whole card */}
                {layout === "imageOnly" && c.cta_href && (
                  <CardLink href={c.cta_href} label={c.title} className="absolute inset-0 z-20" />
                )}

                {/* Card number */}
                {layout !== "imageOnly" && (
                  <span
                    className={cn(
                      "pointer-events-none absolute z-10 font-display font-semibold tracking-[0.3em]",
                      layout === "classic"
                        ? "right-6 top-5 text-sm text-foreground/40 sm:right-9 sm:top-8"
                        : "right-5 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur sm:right-8 sm:top-7",
                    )}
                  >
                    {n}
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}