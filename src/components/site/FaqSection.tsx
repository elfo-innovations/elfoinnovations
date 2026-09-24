import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight } from "lucide-react";
import { FaqRow, FaqShell } from "@/components/site/FaqExplorer";
import { categoryItemClass } from "@/components/site/faq-styles";
import {
  DEFAULT_FAQS,
  fetchFaqData,
  groupFaqs,
  OTHER_CATEGORY_NAME,
  type FaqItem,
} from "@/lib/faq";

// Home / pricing show only the questions the admin marked "Show on the home page" (falling back
// to the first few if none are marked), in the same look as /faqs. The full, categorised list
// lives on /faqs.
const FALLBACK_COUNT = 6;

export function FaqSection() {
  const { data, isPending } = useQuery({
    queryKey: ["faq-data"],
    queryFn: fetchFaqData,
  });

  const { categories, items } = useMemo(() => {
    const all: FaqItem[] =
      data && data.faqs.length > 0
        ? data.faqs
        : DEFAULT_FAQS.map((f, i) => ({
            id: `default-${i}`,
            question: f.question,
            answer: f.answer,
            slug: null,
            category_id: null,
            sort_order: i,
            is_featured: false,
          }));
    const featured = all.filter((f) => f.is_featured);
    return {
      categories: data?.categories ?? [],
      items: featured.length > 0 ? featured : all.slice(0, FALLBACK_COUNT),
    };
  }, [data]);

  const groups = useMemo(() => groupFaqs(categories, items), [categories, items]);
  const [activeId, setActiveId] = useState<string | null>(null); // null = all featured
  const active = groups.find((g) => g.category?.id === activeId);
  const shown = active ? active.items : items;
  const showTabs = groups.filter((g) => g.category).length > 1;

  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FaqShell>
          {isPending ? (
            <div className="mt-8 space-y-3 sm:mt-10">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-card/50 px-5 py-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div
              className={
                showTabs
                  ? "mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8"
                  : "mt-8 sm:mt-10"
              }
            >
              {showTabs && (
                <div
                  role="tablist"
                  aria-label="FAQ categories"
                  className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
                >
                  <CategoryTab
                    label="All Questions"
                    isActive={!active}
                    onClick={() => setActiveId(null)}
                  />
                  {groups.map((g) =>
                    g.category ? (
                      <CategoryTab
                        key={g.category.id}
                        label={g.category.name ?? OTHER_CATEGORY_NAME}
                        isActive={active === g}
                        onClick={() => setActiveId(g.category!.id)}
                      />
                    ) : null,
                  )}
                </div>
              )}
              <HomeFaqList key={active?.category?.id ?? "all"} items={shown} />
            </div>
          )}

          {!isPending && (
            <div className="mt-8 flex justify-center">
              <Link
                to="/faqs"
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-accent/40"
              >
                View all FAQs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </FaqShell>
      </div>
    </section>
  );
}

function CategoryTab({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={categoryItemClass(isActive)}
    >
      <span>{label}</span>
      <ChevronRight
        className={
          isActive
            ? "hidden h-4 w-4 shrink-0 text-primary lg:block"
            : "hidden h-4 w-4 shrink-0 opacity-50 lg:block"
        }
      />
    </button>
  );
}

function HomeFaqList({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <FaqRow
          key={f.id}
          item={f}
          open={openId === f.id}
          onToggle={() => setOpenId((cur) => (cur === f.id ? null : f.id))}
        />
      ))}
    </div>
  );
}
