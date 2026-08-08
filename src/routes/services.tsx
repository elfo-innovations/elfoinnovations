import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ServicesSection } from "@/components/site/ServicesSection";
import { ServicesScrollStory } from "@/components/site/ServicesScrollStory";
import { WorkShowcase } from "@/components/site/WorkShowcase";
import { CtaBanner } from "@/components/site/CtaBanner";

const URL = "https://elfoinnovations.com/services";
const TITLE = "Software Development Services | Web, Mobile, SaaS & Enterprise — ELFO Innovations";
const DESC = "Full-stack software development services from ELFO Innovations: web apps, mobile apps, SaaS platforms, cloud, and enterprise software built to ship.";

export const Route = createFileRoute("/services")({
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
          { "@type": "ListItem", position: 2, name: "Services", item: URL },
        ],
      }),
    }],
  }),
  component: () => (<PublicLayout><ServicesScrollStory /><ServicesSection /><WorkShowcase /><CtaBanner /></PublicLayout>),
});
