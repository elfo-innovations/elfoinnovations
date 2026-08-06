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
import { AboutSection } from "@/components/site/AboutSection";
import { CtaBanner } from "@/components/site/CtaBanner";
import { OffersSection } from "@/components/site/OffersSection";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { ReviewsScroller } from "@/components/site/ReviewsScroller";
import { WorkShowcase } from "@/components/site/WorkShowcase";

const URL = "https://elfoinnovation.lovable.app";
const TITLE = "Custom Software Development Company | Web, Mobile & SaaS — ELFO Innovations";
const DESC = "ELFO Innovations builds custom web, mobile, SaaS, and enterprise software for modern businesses. See your product built before you pay a dime.";

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
    queryFn: async () => (await supabase.from("website_sections").select("section_key,sort_order,is_enabled").eq("is_enabled", true).order("sort_order")).data ?? [],
  });
  const rawOrder = (data as any[] | undefined)?.map((s) => s.section_key).filter((k) => RENDERERS[k]) ?? [
    "hero","showcase","portfolio","services","work","about","pricing","reviews","offers","testimonials","faq","cta",
  ];
  // Merge about+company into a single toggle section (avoid duplicate render)
  const seen = new Set<string>();
  let order = rawOrder.map((k) => (k === "company" ? "about" : k)).filter((k) => (seen.has(k) ? false : (seen.add(k), true)));
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
      {order.map((k) => {
        const C = RENDERERS[k];
        return C ? <C key={k} /> : null;
      })}
    </PublicLayout>
  );
}
