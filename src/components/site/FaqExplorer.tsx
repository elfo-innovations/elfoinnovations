import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryItemClass } from "@/components/site/faq-styles";
import {
  faqAnchor,
  groupFaqs,
  OTHER_CATEGORY_NAME,
  type FaqCategory,
  type FaqGroup,
  type FaqItem,
} from "@/lib/faq";

/**
 * Standalone FAQ experience for /faqs.
 *
 * Crawler / LLM note: every question and answer is rendered into the server HTML.
 * Collapsing is done with a CSS grid-row transition (0fr -> 1fr), NOT by unmounting or
 * `hidden`/`display:none`, so the answer text is always in the DOM and readable without
 * any JavaScript interaction. The default view ("All Questions") lists every category.
 * Category filtering is a progressive enhancement driven by real links (?category=slug).
 */
export function FaqExplorer({
  categories,
  faqs,
  activeSlug,
}: {
  categories: FaqCategory[];
  faqs: FaqItem[];
  activeSlug?: string;
}) {
  const groups = useMemo(() => groupFaqs(categories, faqs), [categories, faqs]);
  const active = groups.find((g) => g.category?.slug === activeSlug);
  const visible: FaqGroup[] = active ? [active] : groups;
  const showSidebar = groups.length > 1;

  return (
    <section className="py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FaqShell as="h1">
          <div
            className={cn(
              "mt-8 grid gap-6 sm:mt-10",
              showSidebar && "lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8",
            )}
          >
            {showSidebar && (
              <nav
                aria-label="FAQ categories"
                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
              >
                <CategoryLink label="All Questions" isActive={!active} slug={undefined} />
                {groups.map((g) => (
                  <CategoryLink
                    key={g.category?.id ?? "other"}
                    label={g.category?.name ?? OTHER_CATEGORY_NAME}
                    isActive={active === g}
                    slug={g.category?.slug}
                    disabled={!g.category}
                  />
                ))}
              </nav>
            )}

            <FaqList key={active?.category?.id ?? "all"} groups={visible} />
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Still have a question?{" "}
            <Link to="/contact" className="font-semibold text-primary hover:underline">
              Contact us
            </Link>
            .
          </p>
        </FaqShell>
      </div>
    </section>
  );
}

/** Glass card with the brand-coloured wash and the page heading, shared by /faqs and the home section. */
export function FaqShell({
  as: Heading = "h2",
  children,
}: {
  as?: "h1" | "h2";
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/60 p-5 shadow-sm sm:p-10">
      {/* soft brand-coloured wash, built from the site's own theme tokens */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-background"
        style={{
          backgroundImage:
            "radial-gradient(60% 55% at 12% 8%, color-mix(in oklab, var(--electric) 16%, transparent), transparent 70%), radial-gradient(55% 50% at 92% 15%, color-mix(in oklab, var(--electric-glow) 14%, transparent), transparent 70%), radial-gradient(50% 45% at 60% 100%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)",
        }}
      />
      <header className="mx-auto max-w-2xl text-center">
        <Heading className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Frequently Asked <span className="electric-text">Questions</span>
        </Heading>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          Everything you need to know about working with ELFO Innovations — how we build, how
          payments work, and how we support you after launch.
        </p>
      </header>
      {children}
    </div>
  );
}

function CategoryLink({
  label,
  slug,
  isActive,
  disabled,
}: {
  label: string;
  slug: string | undefined;
  isActive: boolean;
  disabled?: boolean;
}) {
  const cls = categoryItemClass(isActive);
  const chevron = (
    <ChevronRight
      className={cn("hidden h-4 w-4 shrink-0 lg:block", isActive ? "text-primary" : "opacity-50")}
    />
  );
  // Uncategorised questions only exist inside the "All Questions" view.
  if (disabled) return null;
  return (
    <Link
      to="/faqs"
      search={{ category: slug }}
      resetScroll={false}
      aria-current={isActive ? "page" : undefined}
      className={cls}
    >
      <span>{label}</span>
      {chevron}
    </Link>
  );
}

function FaqList({ groups }: { groups: FaqGroup[] }) {
  const [openId, setOpenId] = useState<string | null>(groups[0]?.items[0]?.id ?? null);

  // Deep links like /faqs#how-long-does-a-typical-project-take open and scroll to that answer.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!hash) return;
    const match = groups.flatMap((g) => g.items).find((f) => faqAnchor(f) === hash);
    if (!match) return;
    setOpenId(match.id);
    document.getElementById(hash)?.scrollIntoView({ block: "start" });
  }, [groups]);

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.category?.id ?? "other"}>
          <h2 className="font-display text-lg font-bold sm:text-xl">
            {g.category?.name ?? OTHER_CATEGORY_NAME}
          </h2>
          {g.category?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{g.category.description}</p>
          )}
          <div className="mt-4 space-y-3">
            {g.items.map((f) => (
              <FaqRow
                key={f.id}
                item={f}
                open={openId === f.id}
                onToggle={() => setOpenId((cur) => (cur === f.id ? null : f.id))}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const anchor = faqAnchor(item);
  const buttonId = `faq-q-${anchor}`;
  const panelId = `faq-a-${anchor}`;
  return (
    <article
      id={anchor}
      className={cn(
        "scroll-mt-28 rounded-2xl border transition-colors",
        open
          ? "border-primary/30 bg-card shadow-sm"
          : "border-border/60 bg-card/50 hover:bg-card/80",
      )}
    >
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold sm:text-base"
        >
          <span>{item.question}</span>
          <Plus
            aria-hidden
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
              open && "rotate-45 text-primary",
            )}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </p>
        </div>
      </div>
    </article>
  );
}
