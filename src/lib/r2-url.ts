// Pure string helpers — safe to import from client code. Deliberately
// has no dependency on r2.server.ts (which holds credentials/env access
// and must never be bundled into the browser).

const R2_PUBLIC_BASE_URL = "https://media.elfoinnovations.com";

/** True if a stored public_url points at our R2 custom domain (i.e. a post-migration upload). */
export function isR2Url(url: string | null | undefined): boolean {
  return !!url && url.startsWith(`${R2_PUBLIC_BASE_URL}/`);
}

/** Extracts the object key from an R2 public URL produced by the R2 upload helper. */
export function keyFromR2Url(url: string): string {
  return url.slice(`${R2_PUBLIC_BASE_URL}/`.length);
}
