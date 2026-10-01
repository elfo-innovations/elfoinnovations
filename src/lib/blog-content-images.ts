// Pure string/regex helpers — no secrets, no network calls, safe on
// client or server. Used when a blog post is deleted, to find its inline
// `blog-content/*` images so they can be cleaned up from storage.

/** Matches new-style R2 URLs: https://media.elfoinnovations.com/blog-content/... */
const R2_BLOG_IMAGE_RE = /https:\/\/media\.elfoinnovations\.com\/(blog-content\/[^"'\s)]+)/g;

/** Matches legacy Supabase signed URLs for the same bucket/prefix, e.g.
 * https://<project>.supabase.co/storage/v1/object/sign/website-media/blog-content/<key>?token=... */
const SUPABASE_BLOG_IMAGE_RE =
  /\/storage\/v1\/object\/sign\/website-media\/(blog-content\/[^?"'\s)]+)/g;

export type BlogContentImageKeys = {
  r2Keys: string[];
  supabasePaths: string[];
};

/**
 * Scans a blog's content_html for inline `blog-content/*` image references
 * and returns their storage keys/paths, split by backend. Deduplicated.
 * Does NOT touch cover images (those are separate media_library assets,
 * managed/deleted via the Media Library UI, possibly shared across posts).
 */
export function extractBlogContentImageKeys(
  contentHtml: string | null | undefined,
): BlogContentImageKeys {
  if (!contentHtml) return { r2Keys: [], supabasePaths: [] };

  const r2Keys = new Set<string>();
  for (const match of contentHtml.matchAll(R2_BLOG_IMAGE_RE)) {
    if (match[1]) r2Keys.add(match[1]);
  }

  const supabasePaths = new Set<string>();
  for (const match of contentHtml.matchAll(SUPABASE_BLOG_IMAGE_RE)) {
    if (match[1]) supabasePaths.add(decodeURIComponent(match[1]));
  }

  return { r2Keys: [...r2Keys], supabasePaths: [...supabasePaths] };
}
