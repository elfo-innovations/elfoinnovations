import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { PricingSection } from "@/components/site/PricingSection";
import { FaqSection } from "@/components/site/FaqSection";

const URL = "https://elfoinnovations.com/pricing";
const TITLE = "Software Development Pricing & Packages | ELFO Innovations";
const DESC = "Transparent pricing for custom software development at ELFO Innovations. Starter to Enterprise packages for web, mobile, and SaaS projects.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://elfoinnovations.com/" },
          { "@type": "ListItem", position: 2, name: "Pricing", item: URL },
        ],
      }),
    }],
  }),
  component: () => (<PublicLayout><div className="pt-8" /><PricingSection /><FaqSection /></PublicLayout>),
});
