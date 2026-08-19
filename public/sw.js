/* ELFO INNOVATIONS — Combined Service Worker
   - Offline-first app shell (network-first for navigations, cache-first for assets)
   - Aggressive cache for the 3D desktop PC assets (/desktop_pc/*)
   - Web Push notifications (unchanged behavior)
   - Background sync for offline inquiry submissions (via IndexedDB queue)
   -EK OR FAZOOL COMMENT
   -bakwas
*/

const VERSION = "elfo-pwa-v5";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const MODEL_CACHE = `${VERSION}-model`;
const FONT_CACHE = `${VERSION}-fonts`;
const IMG_CACHE = `${VERSION}-images`;

// Minimal shell — the HTML shell + favicon + manifest.
// Everything else populates lazily via runtime caching as the user browses.
const SHELL_URLS = ["/", "/favicon-96x96.png", "/site.webmanifest", "/offline.html"];

// Paths that MUST never be cached (private / dynamic / auth surfaces).
const NEVER_CACHE_PREFIXES = [
  "/admin",
  "/developer",
  "/client",
  "/auth",
  "/profile",
  "/api/",
  "/_serverFn",
  "/sitemap",
];

const NEVER_CACHE_HOST_SUBSTR = ["supabase.co", "supabase.in"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(
        SHELL_URLS.map((u) => cache.add(new Request(u, { cache: "reload" }))),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function isNeverCache(url) {
  if (NEVER_CACHE_HOST_SUBSTR.some((h) => url.hostname.includes(h))) return true;
  if (url.origin === self.location.origin) {
    return NEVER_CACHE_PREFIXES.some((p) => url.pathname.startsWith(p));
  }
  return false;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) {
    // Revalidate in background when online (SWR for shell assets).
    if (self.navigator?.onLine !== false) {
      fetch(request)
        .then((res) => {
          if (res && res.ok && (res.type === "basic" || res.type === "cors")) {
            cache.put(request, res.clone()).catch(() => {});
          }
        })
        .catch(() => {});
    }
    return hit;
  }
  const res = await fetch(request);
  if (res && res.ok && (res.type === "basic" || res.type === "cors" || res.type === "opaque")) {
    cache.put(request, res.clone()).catch(() => {});
  }
  return res;
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      // Store the HTML shell keyed to "/" so offline reloads of any route work.
      cache.put("/", res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const cached =
      (await cache.match("/offline.html")) ||
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match("/"));
    if (cached) return cached;
    return new Response("<h1>Offline</h1><p>You are offline and this page is not cached yet.</p>", {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (isNeverCache(url)) return; // let network handle privately

  // HTML navigations → network-first, fall back to cached shell for offline SPA.
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(networkFirstNavigation(req));
    return;
  }

  // 3D desktop PC assets — CRITICAL: cache-first forever after first fetch.
  if (url.origin === self.location.origin && url.pathname.startsWith("/desktop_pc/")) {
    event.respondWith(cacheFirst(req, MODEL_CACHE));
    return;
  }

  // Google Fonts + gstatic
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(req, FONT_CACHE));
    return;
  }

  // Same-origin static assets (built JS/CSS, images, favicon, etc.)
  if (url.origin === self.location.origin) {
    const dest = req.destination;
    if (["style", "script", "worker", "font"].includes(dest)) {
      event.respondWith(cacheFirst(req, RUNTIME_CACHE));
      return;
    }
    if (dest === "image") {
      event.respondWith(cacheFirst(req, IMG_CACHE));
      return;
    }
    // Other same-origin GETs: try network, fall back to cache
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          return res;
        } catch {
          const cache = await caches.open(RUNTIME_CACHE);
          const hit = await cache.match(req);
          if (hit) return hit;
          throw new Error("offline and not cached");
        }
      })(),
    );
  }
});

// ============ Push notifications (preserved) ============
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "ELFO", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "ELFO INNOVATIONS";
  const options = {
    body: data.body || "",
    icon: "/favicon-96x96.png",
    badge: "/favicon-96x96.png",
    tag: data.tag || "elfo-notif",
    data: { link: data.link || "/" },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) {
          try {
            await c.navigate(link);
          } catch (e) {}
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(link);
    })(),
  );
});

// Allow the page to trigger cache warming for the 3D model after it loads.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "PRECACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(MODEL_CACHE);
        await Promise.allSettled(
          data.urls.map(async (u) => {
            try {
              const existing = await cache.match(u);
              if (existing) return;
              const res = await fetch(u, { cache: "no-cache" });
              if (res && res.ok) await cache.put(u, res.clone());
            } catch {}
          }),
        );
      })(),
    );
  }
  if (data.type === "SKIP_WAITING") self.skipWaiting();
});
