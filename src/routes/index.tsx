import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Hero } from "@/components/site/Hero";
import { BeforeAfterShowcase } from "@/components/site/BeforeAfterShowcase";
import { AboutCompanyToggle } from "@/components/site/AboutCompanyToggle";
import { PortfolioSection } from "@/components/site/PortfolioSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { PricingSection } from "@/components/site/PricingSection";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { FaqSection } from "@/components/site/FaqSection";
import { CtaBanner } from "@/components/site/CtaBanner";
import { OffersSection } from "@/components/site/OffersSection";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { ReviewsScroller } from "@/components/site/ReviewsScroller";
import { WorkShowcase } from "@/components/site/WorkShowcase";
import { PromoHeroSlider } from "@/components/site/PromoHeroSlider";
import { PromoHeroImage } from "@/components/site/PromoHeroImage";
import { PromoBanner } from "@/components/site/PromoBanner";
import { CustomPromoSection } from "@/components/site/CustomPromoSection";

const URL = "https://elfoinnovations.com";
const TITLE = "Custom Software Development Company | Web, Mobile & SaaS — ELFO Innovations";
const DESC =
  "ELFO Innovations builds custom web, mobile, SaaS, and enterprise software for modern businesses. See your product built before you pay a dime.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: `${URL}/` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${URL}/` }],
  }),
  component: Home,
});

const RENDERERS: Record<string, React.ComponentType> = {
  hero: Hero,
  showcase: BeforeAfterShowcase,
  portfolio: PortfolioSection,
  services: ServicesSection,
  work: WorkShowcase,
  about: AboutCompanyToggle,
  company: AboutCompanyToggle,
  pricing: PricingSection,
  reviews: ReviewsScroller,
  offers: OffersSection,
  testimonials: TestimonialsSection,
  faq: FaqSection,
  cta: CtaBanner,
};

function Home() {
  const { data } = useQuery({
    queryKey: ["website_sections", "public"],
    queryFn: async () =>
      (
        await supabase
          .from("website_sections")
          .select("section_key,title,sort_order,is_enabled")
          .eq("is_enabled", true)
          .order("sort_order")
      ).data ?? [],
  });
  const { data: promoSettings } = useQuery({
    queryKey: ["promo_settings", "public"],
    queryFn: async () =>
      (await supabase.from("promo_settings").select("*").limit(1).maybeSingle()).data,
  });
  const { data: heroSlideCount = 0 } = useQuery({
    queryKey: ["promo_banners", "hero_slider", "count", "public"],
    enabled: promoSettings?.hero_mode === "slider",
    queryFn: async () =>
      (
        await supabase
          .from("promo_banners")
          .select("id", { count: "exact", head: true })
          .eq("position", "hero_slider")
          .eq("is_active", true)
      ).count ?? 0,
  });
  const promoTheme = (promoSettings?.theme === "light" ? "light" : "dark") as "light" | "dark";
  // Only actually replace the normal hero when there's real content ready — a slider
  // needs 4+ images, an image needs a URL set. Otherwise the normal Hero stays put.
  const heroReplaced =
    (promoSettings?.hero_mode === "slider" && heroSlideCount >= 4) ||
    (promoSettings?.hero_mode === "image" && !!promoSettings?.hero_image_url);

  const sectionTitles = new Map(data?.map((s) => [s.section_key, s.title] as const) ?? []);
  // Custom sections (created via Section Manager → "+ New section") aren't in
  // RENDERERS — keep them in the order so they render via CustomPromoSection below.
  const rawOrder: string[] = data?.map((s) => s.section_key) ?? [
    "hero",
    "showcase",
    "portfolio",
    "services",
    "work",
    "about",
    "pricing",
    "reviews",
    "offers",
    "testimonials",
    "faq",
    "cta",
  ];
  // Merge about+company into a single toggle section (avoid duplicate render)
  const seen = new Set<string>();
  let order = rawOrder
    .map((k) => (k === "company" ? "about" : k))
    .filter((k) => (seen.has(k) ? false : (seen.add(k), true)));
  // Always ensure the work showcase shows right after services
  if (!order.includes("work")) {
    const wIdx = order.indexOf("services");
    if (wIdx >= 0) order = [...order.slice(0, wIdx + 1), "work", ...order.slice(wIdx + 1)];
    else order = [...order, "work"];
  }
  // Always ensure reviews scroller shows right after pricing
  if (!order.includes("reviews")) {
    const idx = order.indexOf("pricing");
    if (idx >= 0) order = [...order.slice(0, idx + 1), "reviews", ...order.slice(idx + 1)];
    else order = [...order, "reviews"];
  }

  return (
    <PublicLayout>
      <AnnouncementBar />
      {heroReplaced && promoSettings?.hero_mode === "slider" && (
        <>
          <PromoHeroSlider theme={promoTheme} />
          <PromoBanner position="after_hero" theme={promoTheme} />
        </>
      )}
      {heroReplaced && promoSettings?.hero_mode === "image" && (
        <>
          <PromoHeroImage imageUrl={promoSettings.hero_image_url} theme={promoTheme} />
          <PromoBanner position="after_hero" theme={promoTheme} />
        </>
      )}
      {order.map((k) => {
        // Promo hero replaces the normal one only when it actually has content ready.
        if (heroReplaced && k === "hero") return null;
        const C = RENDERERS[k];
        const el = C ? (
          <C key={k} />
        ) : (
          <CustomPromoSection
            key={k}
            sectionKey={k}
            sectionTitle={sectionTitles.get(k)}
            theme={promoTheme}
          />
        );
        return (
          <React.Fragment key={k}>
            {el}
            {/* These two run regardless of hero_mode — after_hero/after_services should
                always show once the admin sets them, whether the promo hero is on or not. */}
            {k === "hero" && !heroReplaced && (
              <PromoBanner position="after_hero" theme={promoTheme} />
            )}
            {k === "services" && <PromoBanner position="after_services" theme={promoTheme} />}
          </React.Fragment>
        );
      })}
      <PromoBanner position="footer" theme={promoTheme} />
    </PublicLayout>
  );
}
