import { ArrowRight, ShieldCheck, Sparkles, Check } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useInquiry } from "@/hooks/use-inquiry";
import { Link } from "@tanstack/react-router";

const Monitor3D = lazy(() =>
  import("./Monitor3D").then((m) => ({ default: m.Monitor3D }))
);

function Monitor3DPlaceholder() {
  return (
    <div className="relative mx-auto flex w-full max-w-[820px] items-center justify-center" style={{ aspectRatio: "4 / 3" }}>
      <div className="flex flex-col items-center gap-3 text-foreground/50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <div className="text-[10px] uppercase tracking-[0.25em]">Loading 3D scene…</div>
      </div>
    </div>
  );
}

function DeferredMonitor3D() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w: any = window;
    const schedule = w.requestIdleCallback || ((cb: any) => setTimeout(cb, 200));
    const cancel = w.cancelIdleCallback || clearTimeout;
    const id = schedule(() => setReady(true), { timeout: 1500 });
    return () => cancel(id);
  }, []);
  if (!ready) return <Monitor3DPlaceholder />;
  return (
    <Suspense fallback={<Monitor3DPlaceholder />}>
      <Monitor3D />
    </Suspense>
  );
}

export function Hero() {
  const { open } = useInquiry();
  const { data } = useQuery({
    queryKey: ["hero_content"],
    queryFn: async () => (await supabase.from("hero_content").select("*").maybeSingle()).data,
  });
  const h: any = data || {};
  const heading: string = h.heading || "Custom Software Development for Web, Mobile & SaaS";

  const highlightRaw: string = h.highlight || "";
  // Support multiple highlighted phrases separated by "|" or ","
  const highlights = highlightRaw.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = highlights.length ? new RegExp(`(${highlights.map(escape).join("|")})`, "gi") : null;
  const segments = pattern ? heading.split(pattern) : [heading];
  const headingStyle = h.heading_font ? { fontFamily: `"${h.heading_font}", var(--font-display)` } : undefined;
  const trust: { label: string }[] = (h.trust_items as any) || [
    { label: "No upfront payment" },
    { label: "See before you buy" },
    { label: "Enterprise-grade delivery" },
  ];

  return (
    <section className="relative overflow-hidden bg-hero-radial">
      {/* Section-wide classy backdrop: soft gradient, circuit traces, and glow orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Soft base wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.14] dark:from-primary/[0.14] dark:to-primary/[0.22]" />
        {/* Subtle grid dots */}
        <div className="absolute inset-0 opacity-40 circuit-pattern" />
        {/* Circuit traces radiating from bottom-right */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 800" fill="none" preserveAspectRatio="xMaxYMax slice" aria-hidden>
          <defs>
            <linearGradient id="heroTrace" x1="1" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="var(--electric)" stopOpacity="0.9" />
              <stop offset="60%" stopColor="var(--electric)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--electric)" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="heroNode">
              <stop offset="0%" stopColor="var(--electric-glow)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--electric)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g stroke="url(#heroTrace)" strokeWidth="1.25" fill="none">
            <path d="M1440 780 L1180 780 L1060 660 L900 660 L780 540 L560 540 L440 420 L200 420" />
            <path d="M1440 720 L1240 720 L1120 600 L960 600 L840 480 L640 480 L520 360" />
            <path d="M1440 640 L1300 640 L1180 520 L1020 520 L900 400 L720 400" />
            <path d="M1440 560 L1340 560 L1220 440 L1080 440 L960 320 L820 320" />
            <path d="M1440 460 L1360 460 L1260 360 L1140 360 L1040 260" />
            <path d="M1180 780 L1180 660" />
            <path d="M900 660 L900 540" />
            <path d="M780 540 L780 420" />
            <path d="M1120 600 L1120 480" />
            <path d="M960 600 L960 480" />
          </g>
          <g fill="url(#heroNode)">
            <circle cx="1180" cy="660" r="6" />
            <circle cx="900" cy="540" r="7" />
            <circle cx="780" cy="420" r="5" />
            <circle cx="560" cy="540" r="5" />
            <circle cx="1120" cy="480" r="6" />
            <circle cx="960" cy="320" r="6" />
            <circle cx="1260" cy="360" r="5" />
            <circle cx="720" cy="400" r="4" />
          </g>
        </svg>
        {/* Ambient glow orbs */}
        <div className="absolute -right-24 top-1/3 h-[420px] w-[420px] rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute right-1/3 bottom-0 h-[300px] w-[300px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -left-20 top-10 h-[260px] w-[260px] rounded-full bg-primary/10 blur-[110px]" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-24">

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{h.eyebrow || "Premium software delivery"}</span>
          </div>
          <h1 style={headingStyle} className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {segments.map((seg, i) =>
              pattern && highlights.some((hl) => hl.toLowerCase() === seg.toLowerCase())
                ? <span key={i} className="electric-text">{seg}</span>
                : <span key={i}>{seg}</span>
            )}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{h.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={h.primary_cta_action === "inquiry" ? open : undefined} className="rounded-full px-7 electric-glow">
              {h.primary_cta_label || "Get Started"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {h.secondary_cta_label && (
              <Link to={h.secondary_cta_href || "/portfolio"}>
                <Button size="lg" variant="outline" className="rounded-full px-7">{h.secondary_cta_label}</Button>
              </Link>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {trust.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {i === trust.length - 1 ? <ShieldCheck className="h-4 w-4 text-primary" /> : <Check className="h-4 w-4 text-primary" />}
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          {/* Attractive circuit/glow backdrop behind the code card (works in both themes) */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-primary/20 dark:from-primary/20 dark:to-primary/30" />
            <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 400 400" fill="none" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="circuitLine" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--electric)" stopOpacity="0" />
                  <stop offset="50%" stopColor="var(--electric)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="var(--electric)" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="circuitDot">
                  <stop offset="0%" stopColor="var(--electric-glow)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--electric)" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* diagonal circuit traces */}
              <path d="M 20 380 L 120 380 L 180 320 L 260 320 L 320 260 L 400 260" stroke="url(#circuitLine)" strokeWidth="1.5" />
              <path d="M 0 340 L 80 340 L 140 280 L 240 280 L 300 220 L 400 220" stroke="url(#circuitLine)" strokeWidth="1" />
              <path d="M 40 400 L 40 320 L 100 260 L 100 180 L 160 120 L 260 120" stroke="url(#circuitLine)" strokeWidth="1" />
              <path d="M 200 400 L 200 340 L 280 260 L 280 180 L 360 100" stroke="url(#circuitLine)" strokeWidth="1.5" />
              <path d="M 340 400 L 340 320 L 400 260" stroke="url(#circuitLine)" strokeWidth="1" />
              {/* node dots */}
              <circle cx="120" cy="380" r="4" fill="url(#circuitDot)" />
              <circle cx="260" cy="320" r="5" fill="url(#circuitDot)" />
              <circle cx="320" cy="260" r="4" fill="url(#circuitDot)" />
              <circle cx="100" cy="180" r="4" fill="url(#circuitDot)" />
              <circle cx="280" cy="180" r="5" fill="url(#circuitDot)" />
              <circle cx="360" cy="100" r="4" fill="url(#circuitDot)" />
              <circle cx="200" cy="340" r="3" fill="url(#circuitDot)" />
            </svg>
            <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
            <div className="absolute right-1/4 top-1/3 h-24 w-24 rounded-full bg-primary/30 blur-2xl" />
          </div>

          {h.image_url ? (
            <img src={h.image_url} alt="" className="relative rounded-3xl border object-cover shadow-2xl" />
          ) : (
            <DeferredMonitor3D />
          )}


        </div>
      </div>
    </section>
  );
}
