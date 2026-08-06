import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { PortfolioSection } from "@/components/site/PortfolioSection";
import { BeforeAfterShowcase } from "@/components/site/BeforeAfterShowcase";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";

const URL = "https://elfoinnovation.lovable.app/portfolio";
const TITLE = "Software Development Portfolio | ELFO Innovations";
const DESC = "Selected work from ELFO Innovations — live products, custom software builds, and before/after transformations across web, mobile, and SaaS.";

export const Route = createFileRoute("/portfolio")({
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
          { "@type": "ListItem", position: 1, name: "Home", item: "https://elfoinnovation.lovable.app/" },
          { "@type": "ListItem", position: 2, name: "Portfolio", item: URL },
        ],
      }),
    }],
  }),
  component: () => (<PublicLayout><div className="pt-8" /><PortfolioSection /><BeforeAfterShowcase /><TestimonialsSection /></PublicLayout>),
});
