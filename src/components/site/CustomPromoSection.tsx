import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type BannerRow = {
  id: string;
  media_type: "image" | "video";
  image_url: string;
  title: string | null;
  description: string | null;
  cta_label: string | null;
  cta_href: string | null;
  layout: "full" | "split_left" | "split_right";
  background_color: string | null;
  height_px: number | null;
  text_h_align: "left" | "center" | "right" | null;
  text_v_align: "top" | "center" | "bottom" | null;
};

function Media({ data, className }: { data: BannerRow; className?: string }) {
  return data.media_type === "video" ? (
    <video src={data.image_url} className={className} autoPlay muted loop playsInline />
  ) : (
    <img src={data.image_url} alt={data.title || ""} className={className} />
  );
}

function OneBanner({ data, isDark }: { data: BannerRow; isDark: boolean }) {
  const heightStyle = data.height_px ? { height: `${data.height_px}px` } : {};
  const layout = data.layout || "full";

  if (layout === "split_left" || layout === "split_right") {
    const mediaFirst = layout === "split_left";
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={`grid gap-0 overflow-hidden rounded-2xl border sm:grid-cols-2 ${isDark ? "border-white/10" : ""}`}
          style={data.height_px ? heightStyle : undefined}
        >
          <div className={`relative h-full ${data.height_px ? "" : "aspect-[4/3] sm:aspect-auto"} ${mediaFirst ? "sm:order-1" : "sm:order-2"}`}>
            <Media data={data} className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div
            className={`flex h-full flex-col justify-center p-6 sm:p-10 ${mediaFirst ? "sm:order-2" : "sm:order-1"}`}
            style={{ background: data.background_color || (isDark ? "#0a1128" : undefined) }}
          >
            {data.title && <h3 className={`font-display text-2xl font-bold sm:text-3xl ${data.background_color || isDark ? "text-white" : "text-foreground"}`}>{data.title}</h3>}
            {data.description && <p className={`mt-3 ${data.background_color || isDark ? "text-white/75" : "text-muted-foreground"}`}>{data.description}</p>}
            {data.cta_label && data.cta_href && (
              <Link to={data.cta_href} className="mt-5 w-fit">
                <Button className="rounded-full">{data.cta_label}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const vAlign = data.text_v_align || "bottom";
  const hAlign = data.text_h_align || "left";
  const overlayPosClass =
    `${vAlign === "top" ? "items-start" : vAlign === "center" ? "items-center" : "items-end"} ` +
    `${hAlign === "left" ? "justify-start text-left" : hAlign === "center" ? "justify-center text-center" : "justify-end text-right"}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl" style={data.height_px ? heightStyle : undefined}>
        <Media data={data} className={`w-full object-cover ${data.height_px ? "h-full" : "h-auto max-h-[420px]"}`} />
        {(data.title || (data.cta_label && data.cta_href)) && (
          <div className={`absolute inset-0 flex flex-col gap-2 bg-gradient-to-t from-black/70 to-transparent p-5 ${overlayPosClass}`}>
            <div>
              {data.title && <div className="font-display text-lg font-bold text-white sm:text-xl">{data.title}</div>}
              {data.description && <div className="text-sm text-white/80">{data.description}</div>}
            </div>
            {data.cta_label && data.cta_href && (
              <Link to={data.cta_href}>
                <Button size="sm" className="rounded-full">{data.cta_label}</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders a fully admin-defined section. Created from Web Portal → Section
 * Manager → "+ New section", then designed from Web Portal → Banners by
 * targeting this section's key as the position. Supports one or several
 * stacked banners so a "section" can be more than a single block.
 */
export function CustomPromoSection({ sectionKey, sectionTitle, theme = "dark" }: { sectionKey: string; sectionTitle?: string | null; theme?: "light" | "dark" }) {
  const { data } = useQuery({
    queryKey: ["promo_banners", "custom", sectionKey],
    queryFn: async () =>
      (await (supabase.from("promo_banners") as any).select("*").eq("position", sectionKey).eq("is_active", true).order("sort_order")).data as BannerRow[] ?? [],
  });

  if (!data || data.length === 0) return null;
  const isDark = theme === "dark";

  return (
    <section className={`w-full ${isDark ? "bg-[#050914]" : "bg-background"}`}>
      {sectionTitle && (
        <div className="mx-auto max-w-7xl px-4 pt-10 text-center sm:px-6 lg:px-8">
          <h2 className={`font-display text-3xl font-bold sm:text-4xl ${isDark ? "text-white" : ""}`}>{sectionTitle}</h2>
        </div>
      )}
      {data.map((row) => (
        <OneBanner key={row.id} data={row} isDark={isDark} />
      ))}
    </section>
  );
}
