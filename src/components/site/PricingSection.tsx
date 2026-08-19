import { Check, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useInquiry } from "@/hooks/use-inquiry";
import { formatPriceForLang } from "@/lib/pricing-currency";
import type { LangCode } from "@/i18n";

const DEFAULTS = [
  { name: "STARTER", price: "$500", description: "Launch a simple but polished web presence.", features: ["1–3 page website", "Responsive design", "Basic SEO", "1 revision round"], is_popular: false },
  { name: "PROFESSIONAL", price: "$1,000", description: "For growing brands ready to convert.", features: ["Up to 8 pages", "CMS integration", "Advanced SEO", "3 revision rounds"], is_popular: true },
  { name: "BUSINESS", price: "$1,500", description: "Business-grade with integrations.", features: ["Custom sections", "Integrations & forms", "Analytics setup", "Priority support"], is_popular: false },
  { name: "PREMIUM", price: "Custom", description: "Custom software for ambitious teams.", features: ["Bespoke architecture", "Team assigned", "Roadmap & sprints", "Dedicated PM"], is_popular: false },
  { name: "ENTERPRISE", price: "Custom", description: "Enterprise-grade delivery at scale.", features: ["SLA & compliance", "Cloud infrastructure", "24/7 support", "Security review"], is_popular: false },
];

export function PricingSection() {
  const { open } = useInquiry();
  const { i18n } = useTranslation();
  const { data } = useQuery({
    queryKey: ["pricing_plans"],
    queryFn: async () => (await supabase.from("pricing_plans").select("*").eq("is_active", true).order("sort_order")).data,
  });
  const plans = (data && data.length > 0 ? data : DEFAULTS) as any[];

  return (
    <section id="pricing" className="border-t bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">Pricing</div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Transparent, <span className="electric-text">honest pricing.</span></h2>
          <p className="mt-4 text-muted-foreground">No hidden fees. See it live before you pay.</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {plans.map((p, i) => (
            <div key={p.id ?? i} className={`glass-card relative flex flex-col rounded-2xl p-6 ${p.is_popular ? "border-primary electric-glow" : ""}`}>
              {p.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                  <Sparkles className="mr-1 inline h-3 w-3" />Popular
                </div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{p.name}</div>
              <div className="mt-3 font-display text-3xl font-bold">{formatPriceForLang(p.price, i18n.language as LangCode)}</div>
              <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {(p.features as string[]).map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f}</span></li>
                ))}
              </ul>
              <Button onClick={open} variant={p.is_popular ? "default" : "outline"} className="mt-6 w-full rounded-full">
                {p.cta_label ?? "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}