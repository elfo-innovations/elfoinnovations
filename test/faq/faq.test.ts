import { describe, expect, it } from "vitest";
import {
  buildFaqJsonLd,
  faqAnchor,
  groupFaqs,
  slugify,
  type FaqCategory,
  type FaqItem,
} from "../../src/lib/faq-utils";

const cat = (id: string, name: string, sort: number): FaqCategory => ({
  id,
  name,
  slug: slugify(name),
  description: null,
  sort_order: sort,
});
const item = (id: string, category_id: string | null, sort: number): FaqItem => ({
  id,
  question: `Q ${id}?`,
  answer: `A ${id}`,
  slug: null,
  category_id,
  sort_order: sort,
  is_featured: false,
});

describe("faq helpers", () => {
  it("groups questions by category in category order and puts uncategorised last", () => {
    const cats = [cat("c1", "General Questions", 1), cat("c2", "Pricing & Payments", 2)];
    const faqs = [item("a", "c2", 1), item("b", "c1", 2), item("c", null, 3), item("d", "c1", 4)];
    const groups = groupFaqs(cats, faqs);
    expect(groups.map((g) => g.category?.name ?? null)).toEqual([
      "General Questions",
      "Pricing & Payments",
      null,
    ]);
    expect(groups[0].items.map((f) => f.id)).toEqual(["b", "d"]);
  });

  it("drops empty categories", () => {
    const groups = groupFaqs([cat("c1", "Empty", 1)], []);
    expect(groups).toEqual([]);
  });

  it("slugifies and builds stable anchors", () => {
    expect(slugify("Pricing & Payments")).toBe("pricing-payments");
    expect(faqAnchor({ id: "12345678-aaaa", slug: null })).toBe("faq-12345678");
    expect(faqAnchor({ id: "x", slug: "my-slug" })).toBe("my-slug");
  });

  it("builds FAQPage JSON-LD from the real rows and cannot break out of the script tag", () => {
    const json = buildFaqJsonLd([{ question: "Why?", answer: "Because </script><b>x" }]);
    expect(json).not.toContain("</script>");
    const parsed = JSON.parse(json);
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(1);
    expect(parsed.mainEntity[0].acceptedAnswer.text).toBe("Because </script><b>x");
  });
});
