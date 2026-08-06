import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

export function TestimonialsSection() {
  const { data } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => (await supabase.from("testimonials").select("*").eq("is_approved", true).order("sort_order")).data,
  });
  const items = data ?? [];

  return (
    <section className="border-t bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">Client stories</div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Trusted by <span className="electric-text">ambitious teams.</span></h2>
        </div>
        {items.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Client stories will appear here as reviews are approved.
          </div>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((t: any) => (
              <div key={t.id} className="glass-card rounded-2xl p-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed">"{t.review}"</p>
                <div className="mt-5 flex items-center gap-3">
                  {t.profile_image_url ? (
                    <img src={t.profile_image_url} className="h-10 w-10 rounded-full object-cover" alt={t.client_name} />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{t.client_name[0]}</div>
                  )}
                  <div>
                    <div className="text-sm font-semibold">{t.client_name}</div>
                    {t.company && <div className="text-xs text-muted-foreground">{t.company}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
