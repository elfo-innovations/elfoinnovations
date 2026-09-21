import { type ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PromoMarquee } from "@/components/site/PromoMarquee";
import { supabase } from "@/integrations/supabase/client";
import { SiteChatWidget } from "@/components/site/SiteChatWidget";
import type { Tables } from "@/integrations/supabase/types";
/** Lightens a #rrggbb hex color toward white by the given 0–1 amount. */
function lighten(hex: string, amount: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Picks black or white text based on the background's perceived brightness. */
function contrastText(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#ffffff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0a0a0a" : "#ffffff";
}

function usePromoSettings() {
  return useQuery({
    queryKey: ["promo_settings", "layout"],
    queryFn: async () =>
      (await supabase.from("promo_settings").select("*").limit(1).maybeSingle()).data,
  });
}

function usePromoThemeColors(data: Tables<"promo_settings"> | null | undefined) {
  useEffect(() => {
    const root = document.documentElement;

    // Primary accent — buttons, links, glows.
    if (data?.theme_color_enabled && data?.theme_color) {
      root.style.setProperty("--primary", data.theme_color);
      root.style.setProperty("--electric", data.theme_color);
      root.style.setProperty("--electric-glow", lighten(data.theme_color, 0.25));
      root.style.setProperty("--ring", data.theme_color);
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--electric");
      root.style.removeProperty("--electric-glow");
      root.style.removeProperty("--ring");
    }

    // Background & navbar — separate from the accent color above.
    if (data?.bg_color_enabled && data?.bg_color) {
      root.style.setProperty("--background", data.bg_color);
      root.style.setProperty("--card", lighten(data.bg_color, 0.06));
      root.style.setProperty("--foreground", contrastText(data.bg_color));
    } else {
      root.style.removeProperty("--background");
      root.style.removeProperty("--card");
      root.style.removeProperty("--foreground");
    }

    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--electric");
      root.style.removeProperty("--electric-glow");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--background");
      root.style.removeProperty("--card");
      root.style.removeProperty("--foreground");
    };
  }, [data?.theme_color_enabled, data?.theme_color, data?.bg_color_enabled, data?.bg_color]);
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const { data: promoSettings } = usePromoSettings();
  usePromoThemeColors(promoSettings);
  const promoTheme = (promoSettings?.theme === "light" ? "light" : "dark") as "light" | "dark";

  return (
    <div className="flex min-h-screen flex-col bg-background bg-hero-radial bg-no-repeat">
      {!!promoSettings?.marquee_enabled && (
        <PromoMarquee
          text={promoSettings.marquee_text}
          theme={promoTheme}
          enabled={!!promoSettings.marquee_enabled}
        />
      )}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <SiteChatWidget />
    </div>
  );
}
