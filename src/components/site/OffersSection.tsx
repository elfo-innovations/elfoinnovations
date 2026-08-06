import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";

export function OffersSection() {
  const { data } = useQuery({
    queryKey: ["offers", "public"],
    queryFn: async () => (await supabase.from("offers").select("*").eq("is_active", true).order("created_at", { ascending: false })).data ?? [],
  });
  const offers = (data as any[]) ?? [];
  if (offers.length === 0) return null;
  return (
    <section id="offers" className="border-t bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
            <Gift className="h-3.5 w-3.5 text-primary" /> Special offers
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Limited-time <span className="electric-text">offers.</span>
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <div key={o.id} className="glass-card overflow-hidden rounded-2xl">
              {o.banner_image_url && <img src={o.banner_image_url} alt={o.title} className="h-40 w-full object-cover" />}
              <div className="p-6">
                {o.discount && <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{o.discount}</div>}
                <h3 className="mt-3 font-display text-xl font-bold">{o.title}</h3>
                {o.description && <p className="mt-2 text-sm text-muted-foreground">{o.description}</p>}
                {o.end_date && <div className="mt-3 text-xs text-muted-foreground">Ends {new Date(o.end_date).toLocaleDateString()}</div>}
                {o.cta_label && o.cta_href && (
                  <Link to={o.cta_href}><Button className="mt-5 w-full rounded-full">{o.cta_label}</Button></Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
