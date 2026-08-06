import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

export function AnnouncementBar() {
  const { data } = useQuery({
    queryKey: ["promo_banners", "announcement"],
    queryFn: async () =>
      (await supabase.from("promo_banners").select("*").eq("position", "announcement").order("sort_order")).data ?? [],
  });
  const banner = (data as any[] | undefined)?.[0];
  if (!banner) return null;
  return (
    <div style={{ backgroundColor: banner.background_color || undefined }} className="w-full bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-xs font-medium">
        <span>{banner.title}</span>
        {banner.description && <span className="opacity-80">— {banner.description}</span>}
        {banner.cta_label && banner.cta_href && (
          <Link to={banner.cta_href} className="underline underline-offset-2">{banner.cta_label} →</Link>
        )}
      </div>
    </div>
  );
}
