import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Upload, ImagePlus, Search, Check, Loader2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export async function uploadToWebsiteMedia(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("website-media")
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: signed } = await supabase.storage
    .from("website-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  const url = signed?.signedUrl || "";
  await supabase.from("media_library").insert({
    file_name: file.name,
    storage_path: path,
    public_url: url,
    file_type: file.type,
    file_size: file.size,
    folder: "website",
  });
  return url;
}

export function MediaPicker({
  value,
  onChange,
  label = "Image",
}: {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["media_library"],
    queryFn: async () =>
      (await supabase.from("media_library").select("*").order("created_at", { ascending: false }))
        .data ?? [],
  });

  const filtered = items.filter(
    (m) => !search || m.file_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToWebsiteMedia(file);
      onChange(url);
      qc.invalidateQueries({ queryKey: ["media_library"] });
      toast.success("Uploaded");
      setOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-muted">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Choose image
            </Button>
          </DialogTrigger>

          <DialogContent className="flex h-[85vh] w-[94vw] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:h-[80vh]">
            <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
              <DialogTitle className="text-base sm:text-lg">Media Library</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:py-1.5">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading media…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <ImageOff className="h-8 w-8 opacity-40" />
                  {search
                    ? "No media matches your search."
                    : "No media yet — upload your first image above."}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map((m) => {
                    const selected = value === m.public_url;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onChange(m.public_url ?? "");
                          setOpen(false);
                        }}
                        className={`group relative w-full overflow-hidden rounded-xl border bg-muted transition ${
                          selected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/60"
                        }`}
                      >
                        {/* Fixed, consistent aspect ratio via inline style — guaranteed to
                            render the same on every card regardless of the source image's
                            own dimensions, so the list stays evenly spaced. */}
                        <div
                          className="relative w-full overflow-hidden"
                          style={{ aspectRatio: "21 / 9" }}
                        >
                          <img
                            src={m.public_url ?? undefined}
                            alt={m.file_name}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-3 py-2">
                            <div className="truncate text-left text-xs font-medium text-white">
                              {m.file_name}
                            </div>
                          </div>
                          {selected && (
                            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
