import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DEFAULTS = [
  { question: "How does the 'pay after you see it' model work?", answer: "We design and build the core deliverables first. You review a live preview and only pay once you're satisfied with what you see." },
  { question: "What's included in your enterprise-grade delivery?", answer: "Every project ships through four supervised stages — Frontend, Backend, Database, and Hosting — with admin review, security checks, and staged client approval." },
  { question: "How long does a typical project take?", answer: "Simple websites ship in 1–2 weeks. Business platforms typically take 4–8 weeks. Enterprise programs run on custom timelines." },
  { question: "Do you offer post-launch support?", answer: "Yes. We offer monitoring, maintenance and priority support plans for every product we deliver." },
];

export function FaqSection() {
  const { data } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => (await supabase.from("faqs").select("*").eq("is_active", true).order("sort_order")).data,
  });
  const items = (data && data.length > 0 ? data : DEFAULTS) as any[];

  return (
    <section id="faq" className="border-t bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">FAQ</div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Questions, <span className="electric-text">answered.</span></h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {items.map((f, i) => (
            <AccordionItem key={f.id ?? i} value={`i${i}`} className="glass-card rounded-2xl border-0 px-5">
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">{f.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
