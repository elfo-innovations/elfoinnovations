import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DEFAULT_FAQS } from "@/lib/faq";

// Home / pricing show only the questions the admin marked "Show on home" (falling back to the
// first few if none are marked); the full, categorised list lives on /faqs.
const FALLBACK_COUNT = 6;

export function FaqSection() {
  const { data, isPending } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () =>
      (await supabase.from("faqs").select("*").eq("is_active", true).order("sort_order")).data,
  });
  const all =
    data && data.length > 0
      ? data
      : DEFAULT_FAQS.map((f, i) => ({ ...f, id: `d${i}`, is_featured: false }));
  const featured = all.filter((f) => f.is_featured);
  const items = featured.length > 0 ? featured : all.slice(0, FALLBACK_COUNT);

  return (
    <section id="faq" className="border-t bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
            FAQ
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Questions, <span className="electric-text">answered.</span>
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {isPending
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl border-0 px-5 py-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              ))
            : items.map((f, i) => (
                <AccordionItem
                  key={f.id ?? i}
                  value={`i${i}`}
                  className="glass-card rounded-2xl border-0 px-5"
                >
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
        </Accordion>
        {!isPending && (
          <div className="mt-6 flex justify-center">
            <Link
              to="/faqs"
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-accent/40"
            >
              View all FAQs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
