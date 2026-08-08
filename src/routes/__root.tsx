import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { InquiryProvider } from "@/hooks/use-inquiry";
import { FollowUsProvider } from "@/hooks/use-follow-us";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWABoot } from "@/components/PWABoot";
import { OfflineOverlay } from "@/components/offline/OfflineOverlay";
import "@/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold electric-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

const SITE_URL = "https://elfoinnovations.com";
const SITE_TITLE = "Custom Software Development Company | Web, Mobile & SaaS — ELFO Innovations";
const SITE_DESC = "ELFO Innovations is a custom software development company building web, mobile, SaaS, and enterprise software. See your product built before you pay a dime.";
const SITE_OG_IMAGE = `${SITE_URL}/favicon.png`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESC },
      { name: "author", content: "ELFO Innovations" },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: "ELFO Innovations" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESC },
      { name: "theme-color", content: "#0a1330" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://translate.google.com" },
      { rel: "preconnect", href: "https://translate.googleapis.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://www.gstatic.com" },
      { rel: "preload", as: "script", href: "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Poppins:wght@500;600;700;800&family=Manrope:wght@500;600;700;800&family=Sora:wght@500;600;700;800&family=Outfit:wght@500;600;700;800&family=DM+Sans:wght@500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Urbanist:wght@500;600;700;800&family=Syne:wght@500;600;700;800&family=Bricolage+Grotesque:wght@500;600;700;800&family=Instrument+Serif&family=Playfair+Display:wght@500;600;700;800&family=Fraunces:wght@500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&family=Bebas+Neue&family=Archivo+Black&family=Sen:wght@500;600;700;800&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ELFO Innovations",
          url: SITE_URL,
          logo: SITE_OG_IMAGE,
          description: "Custom software development company providing web, mobile, SaaS, and enterprise software solutions.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ELFO Innovations",
          url: SITE_URL,
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elfo-theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}` }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <InquiryProvider>
            <FollowUsProvider>
              <TooltipProvider>
                <Outlet />
                <PWABoot />
                <OfflineOverlay />
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </FollowUsProvider>
          </InquiryProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
