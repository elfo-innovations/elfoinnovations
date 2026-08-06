import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye, EyeOff, Save, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MediaPicker } from "@/components/web-portal/MediaPicker";

export const Route = createFileRoute("/admin/blogs")({
  head: () => ({ meta: [{ title: "Blogs — Admin" }] }),
  component: AdminBlogs,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

const EMPTY = {
  id: "" as string,
  slug: "",
  title: "",
  excerpt: "",
  content_md: "",
  cover_image: "",
  tags: "",
  author_name: "ELFO INNOVATIONS",
  meta_title: "",
  meta_description: "",
  is_published: false,
  reading_minutes: null as number | null,
};

function AdminBlogs() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });

  const { data } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => (await supabase.from("blogs").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const startNew = () => { setForm({ ...EMPTY }); setOpen(true); };
  const edit = (b: any) => {
    setForm({
      id: b.id, slug: b.slug, title: b.title, excerpt: b.excerpt ?? "",
      content_md: b.content_md ?? "", cover_image: b.cover_image ?? "",
      tags: (b.tags ?? []).join(", "), author_name: b.author_name ?? "ELFO INNOVATIONS",
      meta_title: b.meta_title ?? "", meta_description: b.meta_description ?? "",
      is_published: !!b.is_published, reading_minutes: b.reading_minutes ?? null,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!form.id && form.title && !form.slug) setForm((f) => ({ ...f, slug: slugify(f.title) }));
  }, [form.title]); // eslint-disable-line

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.slug.trim()) return toast.error("Slug is required");
    setBusy(true);
    const payload: any = {
      slug: slugify(form.slug),
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      content_md: form.content_md,
      cover_image: form.cover_image || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      author_name: form.author_name.trim() || "ELFO INNOVATIONS",
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      is_published: form.is_published,
      reading_minutes: form.reading_minutes,
      published_at: form.is_published ? new Date().toISOString() : null,
    };
    const { error } = form.id
      ? await supabase.from("blogs").update(payload).eq("id", form.id)
      : await supabase.from("blogs").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Article updated" : "Article created");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  const togglePublish = async (b: any) => {
    const next = !b.is_published;
    const { error } = await supabase.from("blogs").update({
      is_published: next, published_at: next ? new Date().toISOString() : null,
    }).eq("id", b.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  return (
    <DashboardShell role="admin">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Blogs</h1>
          <p className="mt-1 text-sm text-muted-foreground">SEO articles that rank your site. Publish long-form to grow organic traffic.</p>
        </div>
        <div className="flex gap-2">
          <a href="/blog" target="_blank" rel="noreferrer"><Button variant="outline" className="rounded-full"><ExternalLink className="mr-1.5 h-4 w-4" /> View blog</Button></a>
          <Button onClick={startNew} className="rounded-full electric-glow"><Plus className="mr-1.5 h-4 w-4" /> New Article</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(data ?? []).map((b: any) => (
          <div key={b.id} className="glass-card overflow-hidden rounded-2xl">
            {b.cover_image && <div className="aspect-[16/7] overflow-hidden bg-muted"><img src={b.cover_image} alt="" className="h-full w-full object-cover" /></div>}
            <div className="p-5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                <span className={b.is_published ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                  {b.is_published ? "Published" : "Draft"}
                </span>
                <span className="text-muted-foreground">/{b.slug}</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-bold">{b.title}</h3>
              {b.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.excerpt}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(b)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => togglePublish(b)}>
                  {b.is_published ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Unpublish</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Publish</>}
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:bg-destructive/10" onClick={() => del(b.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No articles yet. Click "New Article" to publish your first SEO post.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="How we ship enterprise software in 4 stages" />
            </div>
            <div className="grid gap-1.5">
              <Label>Slug * (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="how-we-ship-enterprise-software" />
              <p className="text-xs text-muted-foreground">Will appear at /blog/{form.slug || "your-slug"}</p>
            </div>
            <MediaPicker label="Cover image" value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} />
            <div className="grid gap-1.5">
              <Label>Excerpt (1–2 sentence summary)</Label>
              <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Content (Markdown-lite: use `# heading`, blank lines for paragraphs, `- ` for lists)</Label>
              <Textarea rows={14} value={form.content_md} onChange={(e) => setForm({ ...form, content_md: e.target.value })} className="font-mono text-sm" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Tags (comma separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="engineering, cloud" />
              </div>
              <div className="grid gap-1.5">
                <Label>Author</Label>
                <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Reading minutes</Label>
                <Input type="number" min={1} value={form.reading_minutes ?? ""} onChange={(e) => setForm({ ...form, reading_minutes: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="flex items-end gap-3">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <span className="text-sm">{form.is_published ? "Published" : "Draft"}</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>SEO title (optional override)</Label>
                <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>SEO description</Label>
                <Input value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={busy} className="electric-glow">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Article</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
