import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { FaqExplorer } from "@/components/site/FaqExplorer";
import { buildFaqJsonLd, DEFAULT_FAQS, fetchFaqData, type FaqItem } from "@/lib/faq";

const URL = "https://elfoinnovations.com/faqs";
const TITLE = "Frequently Asked Questions | ELFO Innovations";
const DESC =
  "Answers to common questions about ELFO Innovations: our pay-after-you-see-it model, pricing and payments, delivery process, hosting, migrations and support.";

export const Route = createFileRoute("/faqs")({
  validateSearch: (s: Record<string, unknown>): { category?: string } => ({
    category: typeof s.category === "string" && s.category ? s.category : undefined,
  }),
  loader: async () => {
    const data = await fetchFaqData();
    if (data.faqs.length > 0) return data;
    // Table empty or unreachable: keep the page useful with the built-in defaults.
    const faqs: FaqItem[] = DEFAULT_FAQS.map((f, i) => ({
      id: `default-${i}`,
      question: f.question,
      answer: f.answer,
      slug: null,
      category_id: null,
      sort_order: i,
      is_featured: i < 6,
    }));
    return { categories: [], faqs };
  },
  head: ({ loaderData }) => ({
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
            { "@type": "ListItem", position: 2, name: "FAQs", item: URL },
          ],
        }),
      },
      ...(loaderData && loaderData.faqs.length > 0
        ? [{ type: "application/ld+json", children: buildFaqJsonLd(loaderData.faqs) }]
        : []),
    ],
  }),
  component: FaqsPage,
});

function FaqsPage() {
  const { categories, faqs } = Route.useLoaderData();
  const { category } = Route.useSearch();
  return (
    <PublicLayout>
      <FaqExplorer categories={categories} faqs={faqs} activeSlug={category} />
    </PublicLayout>
  );
}
