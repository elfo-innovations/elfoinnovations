import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/utils";

export type BlogSuggestion = {
  title: string;
  excerpt: string;
  tldr: string;
  category: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  reading_minutes: number;
  content_html: string;
};

export function CoverImageSuggestions({
  coverImage,
  onApply,
}: {
  coverImage: string;
  onApply: (s: BlogSuggestion) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BlogSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!coverImage) return null;

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const { data, error } = await supabase.functions.invoke("blog-suggestions", {
        body: { imageUrl: coverImage },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestions(data.suggestions);
    } catch (e) {
      setError(getErrorMessage(e, "Couldn't generate suggestions for this image."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed p-3">
      {!suggestions && !loading && !error && (
        <Button type="button" size="sm" variant="outline" onClick={generate}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Suggest titles from this image
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Looking at your image…
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-destructive">{error}</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => setError(null)}>
            <X className="mr-1 h-3.5 w-3.5" /> Dismiss
          </Button>
        </div>
      )}

      {suggestions && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Tap one to auto-fill, or dismiss to write your own
            </span>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSuggestions(null)}>
              <X className="mr-1 h-3.5 w-3.5" /> Dismiss
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onApply(s);
                  setSuggestions(null);
                }}
                className="rounded-lg border p-3 text-left text-xs transition hover:border-primary hover:bg-primary/5"
              >
                <div className="font-semibold">{s.title}</div>
                <div className="mt-1 line-clamp-3 text-muted-foreground">{s.excerpt}</div>
                {s.category && (
                  <div className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {s.category}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
