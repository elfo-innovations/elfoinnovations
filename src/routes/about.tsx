import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { AboutSection } from "@/components/site/AboutSection";
import { CtaBanner } from "@/components/site/CtaBanner";

const URL = "https://elfoinnovations.com/about";
const TITLE = "About ELFO Innovations | Custom Software Development Company";
const DESC = "Learn about ELFO Innovations — a custom software development company delivering web, mobile, SaaS, and enterprise solutions with a see-before-you-pay model.";

export const Route = createFileRoute("/about")({
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
          { "@type": "ListItem", position: 2, name: "About", item: URL },
        ],
      }),
    }],
  }),
  component: () => (<PublicLayout><div className="pt-8" /><AboutSection /><CtaBanner /></PublicLayout>),
});
