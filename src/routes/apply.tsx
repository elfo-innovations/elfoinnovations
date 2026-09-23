import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { DeveloperApplicationForm } from "@/components/recruitment/DeveloperApplicationForm";
import { Rocket } from "lucide-react";

const URL = "https://elfoinnovations.com/apply";
const TITLE = "Developer Application | ELFO Innovations";
const DESC =
  "Apply to join ELFO Innovations as a developer. Submit your details, skills, and resume — our engineering team reviews every application.";

export const Route = createFileRoute("/apply")({
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://elfoinnovations.com/",
            },
            { "@type": "ListItem", position: 2, name: "Developer Application", item: URL },
          ],
        }),
      },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  return (
    <PublicLayout>
      <section className="px-4 pb-20 pt-12 sm:pt-16">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            <Rocket className="h-3.5 w-3.5" /> ELFO Innovations
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Developer Application
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Apply to join our engineering team — fill out the form below to get started.
          </p>
        </div>
        <DeveloperApplicationForm />
      </section>
    </PublicLayout>
  );
}
