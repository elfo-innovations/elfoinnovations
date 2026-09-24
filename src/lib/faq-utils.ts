// Pure helpers (no Supabase import) so they can be unit-tested in plain Node.

export type FaqCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  slug: string | null;
  category_id: string | null;
  sort_order: number;
  is_featured: boolean;
};

export type FaqGroup = { category: FaqCategory | null; items: FaqItem[] };

export const OTHER_CATEGORY_NAME = "More Questions";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

/** Stable anchor id for a question (DB slug, or a short id-based fallback). */
export function faqAnchor(f: Pick<FaqItem, "id" | "slug">): string {
  return f.slug || `faq-${f.id.slice(0, 8)}`;
}

export function groupFaqs(categories: FaqCategory[], faqs: FaqItem[]): FaqGroup[] {
  const groups: FaqGroup[] = categories
    .map((category) => ({ category, items: faqs.filter((f) => f.category_id === category.id) }))
    .filter((g) => g.items.length > 0);
  const loose = faqs.filter((f) => f.category_id === null);
  if (loose.length > 0) groups.push({ category: null, items: loose });
  return groups;
}

/** FAQPage structured data built from the real rows. `<` is escaped so an answer can't close the script tag. */
export function buildFaqJsonLd(faqs: Pick<FaqItem, "question" | "answer">[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  }).replace(/</g, "\\u003c");
}
