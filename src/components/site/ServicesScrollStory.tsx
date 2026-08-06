import { useEffect, useRef } from "react";
import { ArrowRight, Github, Bot, Code2, Smartphone, Palette, Sparkles, Megaphone } from "lucide-react";
import { useInquiry } from "@/hooks/use-inquiry";
import { cn } from "@/lib/utils";

/**
 * Configurable brand constants — replace when the real assets/URL are ready.
 */
export const GITHUB_REPO_URL = "https://github.com/elfo-innovations";

type Card = {
  n: string;
  title: string;
  description: string;
  icon: typeof Code2;
  /** Placeholder: drop the real service image URL here (leave null for the animated fallback). */
  image: string | null;
};

const CARDS: Card[] = [
  { n: "01", title: "AI Automation", description: "Agents, copilots and workflow automation that remove busywork and compound your team's output.", icon: Bot, image: null },
  { n: "02", title: "Web Development", description: "Blazing-fast, accessible web platforms engineered on modern stacks and built to scale.", icon: Code2, image: null },
  { n: "03", title: "Mobile Apps", description: "Native-feeling iOS and Android products with offline-first architecture and buttery motion.", icon: Smartphone, image: null },
  { n: "04", title: "UI/UX Design", description: "Interface systems with luxury typography, deliberate spacing and conversion-first flows.", icon: Palette, image: null },
  { n: "05", title: "Branding", description: "Identity, tone and visual language that makes your product feel inevitable in its market.", icon: Sparkles, image: null },
  { n: "06", title: "Digital Marketing", description: "Performance campaigns, SEO and content engineered around measurable pipeline growth.", icon: Megaphone, image: null },
];

/** Magnetic, glowing CTA used across the story cards. */
function MagneticCta({ label, onClick }: { label: string; onClick: () => void }) {
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

  return (
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
}

export function ServicesScrollStory() {
  const { open } = useInquiry();
  const rootRef = useRef<HTMLDivElement>(null);

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
  }, []);

  return (
    <section ref={rootRef} id="services-story" aria-labelledby="services-story-heading" className="relative overflow-hidden border-t bg-background">
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
            <div data-story-reveal className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> What we do
            </div>
            <h2 id="services-story-heading" data-story-reveal className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Six disciplines. <span className="electric-text">One studio.</span>
            </h2>
            <p data-story-reveal className="mt-5 max-w-xl text-lg text-muted-foreground">
              Scroll through the work we do — each capability engineered end to end, shipped with the polish of a product team, not an outsourcing shop.
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
      <div data-story-stage className="relative mt-14 flex h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto h-[74vh] w-full max-w-6xl overflow-hidden rounded-[32px]">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <article
                key={c.n}
                data-story-card
                style={{ zIndex: i + 1, willChange: "transform, opacity" }}
                className={cn(
                  "glass-card absolute inset-0 grid overflow-hidden rounded-[32px] border shadow-2xl",
                  "grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1",
                )}
              >
                {/* Copy */}
                <div className="relative flex flex-col justify-center gap-5 p-7 sm:p-10 lg:p-14">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{c.title}</h3>
                  <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">{c.description}</p>
                  <div className="pt-1">
                    <MagneticCta label="Start a project" onClick={open} />
                  </div>
                </div>

                {/* Visual — replace `image` above with the real asset when available */}
                <div className="relative hidden overflow-hidden lg:block">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={`${c.title} at ELFO Innovations`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                    />
                  ) : (
                    <div aria-hidden className="relative h-full w-full bg-gradient-to-br from-primary/20 via-transparent to-primary/35">
                      <div className="absolute inset-0 opacity-50 circuit-pattern" />
                      <div className="absolute -right-10 top-1/3 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
                      <div className="absolute bottom-8 left-8 text-[11px] uppercase tracking-[0.3em] text-foreground/40">
                        Image placeholder
                      </div>
                    </div>
                  )}
                </div>

                {/* Card number */}
                <span className="pointer-events-none absolute right-6 top-5 font-display text-sm font-semibold tracking-[0.3em] text-foreground/40 sm:right-9 sm:top-8">
                  {c.n}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
