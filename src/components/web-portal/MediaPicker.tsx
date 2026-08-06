import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Upload, ImagePlus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export async function uploadToWebsiteMedia(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("website-media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: signed } = await supabase.storage.from("website-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  const url = signed?.signedUrl || "";
  await supabase.from("media_library").insert({
    file_name: file.name, storage_path: path, public_url: url,
    file_type: file.type, file_size: file.size, folder: "website",
  } as any);
  return url;
}

export function MediaPicker({ value, onChange, label = "Image" }: { value?: string | null; onChange: (url: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["media_library"],
    queryFn: async () => (await supabase.from("media_library").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = (items as any[]).filter((m) => !search || m.file_name?.toLowerCase().includes(search.toLowerCase()));

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToWebsiteMedia(file);
      onChange(url);
      qc.invalidateQueries({ queryKey: ["media_library"] });
      toast.success("Uploaded");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-16 w-16 rounded-lg border object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted"><ImagePlus className="h-5 w-5 text-muted-foreground" /></div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">Choose image</Button>
          </DialogTrigger>
          {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>Remove</Button>}
        </Dialog>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Media Library</DialogTitle></DialogHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            </label>
          </div>
          <div className="grid max-h-[60vh] gap-3 overflow-auto sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((m: any) => (
              <button key={m.id} type="button" onClick={() => { onChange(m.public_url); setOpen(false); }}
                className="group relative overflow-hidden rounded-lg border hover:ring-2 hover:ring-primary">
                <img src={m.public_url} alt={m.file_name} className="aspect-square w-full object-cover" />
                <div className="truncate p-1 text-[10px]">{m.file_name}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No media yet.</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
