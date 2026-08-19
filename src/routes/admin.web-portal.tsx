import { useMemo, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MediaPicker, uploadToWebsiteMedia } from "@/components/web-portal/MediaPicker";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Image as ImageIcon, Home, Menu as MenuIcon, Sparkles, Briefcase, DollarSign, Gift, Megaphone,
  BookOpen, HelpCircle, Star, Images, Move, Eye, Trash2, Plus, Save, GripVertical, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/admin/web-portal")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: (s.tab as string) || "overview" }),
  component: WebPortalPage,
});

const TABS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "sections", label: "Section Manager", icon: Move },
  { id: "hero", label: "Hero", icon: Sparkles },
  { id: "navbar", label: "Navbar", icon: MenuIcon },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "portfolio", label: "Portfolio", icon: ImageIcon },
  { id: "beforeafter", label: "Before / After", icon: Images },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "offers", label: "Offers", icon: Gift },
  { id: "banners", label: "Banners", icon: Megaphone },
  { id: "about", label: "About", icon: BookOpen },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "media", label: "Media Library", icon: Images },
  { id: "preview", label: "Preview", icon: Eye },
];

function WebPortalPage() {
  const { tab } = useSearch({ from: "/admin/web-portal" }) as { tab: string };
  return (
    <DashboardShell role="admin">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Web Portal</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Manage your public website — content, images, offers, pricing, and layout.</p>
      </div>
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
        {/* Mobile / tablet horizontal tab bar */}
        <div className="glass-card mb-4 rounded-2xl p-1.5 sm:p-2 lg:hidden">
          <div className="flex items-center gap-2 px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Pages</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{TABS.length}</span>
            <span className="ml-auto text-[10px] font-normal normal-case text-muted-foreground/70">Scroll →</span>
          </div>
          <nav className="-mx-1.5 flex gap-1 overflow-x-auto px-1.5 pb-1 [scrollbar-width:thin]">
            {TABS.map((t) => (
              <Link key={t.id} to="/admin/web-portal" search={{ tab: t.id }}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap sm:text-sm ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop vertical sidebar */}
        <aside className="glass-card sticky top-6 hidden h-fit max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl p-2 lg:block">
          <div className="flex items-center gap-2 px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Pages</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{TABS.length}</span>
          </div>
          <nav className="space-y-0.5">
            {TABS.map((t) => (
              <Link key={t.id} to="/admin/web-portal" search={{ tab: t.id }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {tab === "overview" && <Overview />}
          {tab === "sections" && <SectionsManager />}
          {tab === "hero" && <HeroEditor />}
          {tab === "navbar" && <NavbarEditor />}
          {tab === "services" && <ServicesEditor />}
          {tab === "portfolio" && <PortfolioEditor />}
          {tab === "beforeafter" && <BeforeAfterEditor />}
          {tab === "pricing" && <PricingEditor />}
          {tab === "offers" && <OffersEditor />}
          {tab === "banners" && <BannersEditor />}
          {tab === "about" && <AboutEditor />}
          {tab === "faq" && <FaqEditor />}
          {tab === "reviews" && <ReviewsEditor />}
          {tab === "media" && <MediaLibrary />}
          {tab === "preview" && <PreviewPane />}
        </div>
      </div>


    </DashboardShell>
  );
}

/* ---------- Overview ---------- */
function Overview() {
  const { data } = useQuery({
    queryKey: ["wp-overview"],
    queryFn: async () => {
      const [s, sv, po, pr, of, tm, fq] = await Promise.all([
        supabase.from("website_sections").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("portfolio_projects").select("id", { count: "exact", head: true }),
        supabase.from("pricing_plans").select("id", { count: "exact", head: true }),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("is_approved", true),
        supabase.from("faqs").select("id", { count: "exact", head: true }),
      ]);
      return {
        sections: s.count ?? 0, services: sv.count ?? 0, portfolio: po.count ?? 0,
        pricing: pr.count ?? 0, offers: of.count ?? 0, reviews: tm.count ?? 0, faqs: fq.count ?? 0,
      };
    },
  });
  const stats = [
    { l: "Sections", v: data?.sections }, { l: "Services", v: data?.services }, { l: "Portfolio", v: data?.portfolio },
    { l: "Pricing plans", v: data?.pricing }, { l: "Active offers", v: data?.offers }, { l: "Approved reviews", v: data?.reviews }, { l: "FAQs", v: data?.faqs },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="glass-card rounded-2xl p-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.l}</div>
            <div className="mt-2 font-display text-2xl font-bold">{s.v ?? "…"}</div>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <div className="font-display text-lg font-bold">Quick actions</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/admin/web-portal" search={{ tab: "hero" }}><Button variant="outline">Edit hero</Button></Link>
          <Link to="/admin/web-portal" search={{ tab: "offers" }}><Button variant="outline">New offer</Button></Link>
          <Link to="/admin/web-portal" search={{ tab: "banners" }}><Button variant="outline">Banners</Button></Link>
          <Link to="/admin/web-portal" search={{ tab: "sections" }}><Button variant="outline">Reorder sections</Button></Link>
          <a href="/" target="_blank" rel="noreferrer"><Button><ExternalLink className="mr-2 h-4 w-4" />View site</Button></a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sections Manager (drag reorder + enable) ---------- */
function SortableRow({ id, children }: { id: string; children: (h: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

function SectionsManager() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["website_sections", "admin"],
    queryFn: async () => (await supabase.from("website_sections").select("*").order("sort_order")).data ?? [],
  });
  const items = data as any[];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = items.findIndex((i) => i.id === e.active.id);
    const newIdx = items.findIndex((i) => i.id === e.over!.id);
    const next = arrayMove(items, oldIdx, newIdx);
    qc.setQueryData(["website_sections", "admin"], next);
    for (let i = 0; i < next.length; i++) {
      await supabase.from("website_sections").update({ sort_order: (i + 1) * 10 }).eq("id", next[i].id);
    }
    qc.invalidateQueries({ queryKey: ["website_sections"] });
    toast.success("Order updated");
  };

  const toggle = async (id: string, is_enabled: boolean) => {
    await supabase.from("website_sections").update({ is_enabled }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["website_sections"] });
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-bold">Section Manager</div>
          <p className="text-sm text-muted-foreground">Drag to reorder, toggle to hide/show.</p>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((s) => (
              <SortableRow key={s.id} id={s.id}>
                {(handle) => (
                  <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <button {...handle} className="cursor-grab text-muted-foreground"><GripVertical className="h-5 w-5" /></button>
                    <div className="flex-1">
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.section_key}</div>
                    </div>
                    <Switch checked={s.is_enabled} onCheckedChange={(v) => toggle(s.id, v)} />
                  </div>
                )}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ---------- Hero Editor ---------- */
function HeroEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["hero_content", "admin"],
    queryFn: async () => (await supabase.from("hero_content").select("*").maybeSingle()).data,
  });
  const [f, setF] = useState<any>({});
  useMemo(() => { if (data && Object.keys(f).length === 0) setF(data); }, [data]);

  const save = async () => {
    const payload = { ...f };
    delete payload.created_at; delete payload.updated_at;
    const { error } = await supabase.from("hero_content").update(payload).eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["hero_content"] });
  };

  const trust: any[] = f.trust_items || [];
  return (
    <div className="glass-card space-y-4 rounded-2xl p-4 sm:p-6">
      <div className="font-display text-lg font-bold">Hero Section</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Eyebrow (small tag)" value={f.eyebrow} onChange={(v) => setF({ ...f, eyebrow: v })} />
        <div>
          <Field
            label="Highlighted phrase(s) — separate multiple with a comma"
            value={f.highlight}
            onChange={(v) => setF({ ...f, highlight: v })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Every match inside the heading gets the blue electric color. Example: <code>Today, Tomorrow</code>
          </p>
        </div>
      </div>
      <Field label="Heading" value={f.heading} onChange={(v) => setF({ ...f, heading: v })} />
      <div>
        <Label>Heading font</Label>
        <select
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={f.heading_font || ""}
          onChange={(e) => setF({ ...f, heading_font: e.target.value || null })}
        >
          <option value="">Default (Space Grotesk)</option>
          {[
            "Space Grotesk","Inter","Poppins","Manrope","Sora","Outfit","DM Sans",
            "Plus Jakarta Sans","Urbanist","Syne","Bricolage Grotesque","Sen",
            "Playfair Display","Fraunces","Cormorant Garamond","Instrument Serif",
            "Bebas Neue","Archivo Black",
          ].map((fn) => (
            <option key={fn} value={fn} style={{ fontFamily: `"${fn}"` }}>{fn}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">Applies to the hero heading only.</p>
      </div>
      <TextField label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary CTA label" value={f.primary_cta_label} onChange={(v) => setF({ ...f, primary_cta_label: v })} />
        <Field label="Primary CTA action ('inquiry' or URL)" value={f.primary_cta_action} onChange={(v) => setF({ ...f, primary_cta_action: v })} />
        <Field label="Secondary CTA label" value={f.secondary_cta_label} onChange={(v) => setF({ ...f, secondary_cta_label: v })} />
        <Field label="Secondary CTA href" value={f.secondary_cta_href} onChange={(v) => setF({ ...f, secondary_cta_href: v })} />
      </div>
      <MediaPicker label="Hero image (optional)" value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} />
      <div>
        <Label>Trust items</Label>
        <div className="mt-2 space-y-2">
          {trust.map((t, i) => (
            <div key={i} className="flex gap-2">
              <Input value={t.label} onChange={(e) => { const n = [...trust]; n[i] = { label: e.target.value }; setF({ ...f, trust_items: n }); }} />
              <Button variant="ghost" size="icon" onClick={() => setF({ ...f, trust_items: trust.filter((_, k) => k !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setF({ ...f, trust_items: [...trust, { label: "" }] })}><Plus className="mr-1 h-4 w-4" />Add item</Button>
        </div>
      </div>
      <Button onClick={save}><Save className="mr-2 h-4 w-4" />Save Hero</Button>
    </div>
  );
}

/* ---------- Navbar Editor ---------- */
function NavbarEditor() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["nav_links", "admin"],
    queryFn: async () => (await supabase.from("nav_links").select("*").order("sort_order")).data ?? [],
  });
  const links = data as any[];
  const [label, setLabel] = useState(""); const [href, setHref] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(links, links.findIndex((i) => i.id === e.active.id), links.findIndex((i) => i.id === e.over!.id));
    qc.setQueryData(["nav_links", "admin"], next);
    for (let i = 0; i < next.length; i++) await supabase.from("nav_links").update({ sort_order: (i + 1) * 10 }).eq("id", next[i].id);
    qc.invalidateQueries({ queryKey: ["nav_links"] });
  };
  const add = async () => {
    if (!label || !href) return;
    await supabase.from("nav_links").insert({ label, href, sort_order: (links.length + 1) * 10 } as any);
    setLabel(""); setHref(""); qc.invalidateQueries({ queryKey: ["nav_links"] });
  };
  const update = async (id: string, patch: any) => { await supabase.from("nav_links").update(patch).eq("id", id); qc.invalidateQueries({ queryKey: ["nav_links"] }); };
  const del = async (id: string) => { await supabase.from("nav_links").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["nav_links"] }); };

  return (
    <div className="glass-card space-y-4 rounded-2xl p-4 sm:p-6">
      <div className="font-display text-lg font-bold">Navbar Links</div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {links.map((l) => (
              <SortableRow key={l.id} id={l.id}>
                {(handle) => (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">
                    <button {...handle} className="cursor-grab p-2 text-muted-foreground"><GripVertical className="h-5 w-5" /></button>
                    <Input className="min-w-0 flex-1 basis-[45%]" defaultValue={l.label} onBlur={(e) => update(l.id, { label: e.target.value })} />
                    <Input className="min-w-0 flex-1 basis-[45%]" defaultValue={l.href} onBlur={(e) => update(l.id, { href: e.target.value })} />
                    <Switch checked={l.is_enabled} onCheckedChange={(v) => update(l.id, { is_enabled: v })} />
                    <Button variant="ghost" size="icon" onClick={() => del(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex flex-wrap gap-2 rounded-xl border border-dashed p-3">
        <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="min-w-0 flex-1 basis-[45%]" />
        <Input placeholder="/path" value={href} onChange={(e) => setHref(e.target.value)} className="min-w-0 flex-1 basis-[45%]" />
        <Button onClick={add} className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" />Add</Button>
      </div>
    </div>
  );
}

/* ---------- Reusable Field ---------- */
function Field({ label, value, onChange, type = "text" }: { label: string; value?: any; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}
function TextField({ label, value, onChange }: { label: string; value?: any; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1" rows={3} />
    </div>
  );
}

/* ---------- Generic CRUD table ---------- */
function CrudList<T extends { id: string }>({
  title, table, orderBy = "sort_order", visibilityCol, columns, renderForm, empty,
}: {
  title: string; table: string; orderBy?: string; visibilityCol?: string;
  columns: { label: string; render: (r: any) => React.ReactNode }[];
  renderForm: (state: any, setState: (v: any) => void) => React.ReactNode;
  empty: any;
}) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: [table, "admin"],
    queryFn: async () => (await supabase.from(table as any).select("*").order(orderBy, { ascending: true })).data ?? [],
  });
  const rows = data as any[];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const save = async () => {
    const p = { ...editing };
    delete p.created_at; delete p.updated_at;
    let err;
    if (p.id) { const { error } = await supabase.from(table as any).update(p).eq("id", p.id); err = error; }
    else { const { error } = await supabase.from(table as any).insert(p); err = error; }
    if (err) return toast.error(err.message);
    toast.success("Saved");
    setOpen(false); setEditing(null);
    qc.invalidateQueries({ queryKey: [table] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from(table as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: [table] });
  };
  const toggleVis = async (id: string, v: boolean) => {
    if (!visibilityCol) return;
    await supabase.from(table as any).update({ [visibilityCol]: v }).eq("id", id);
    qc.invalidateQueries({ queryKey: [table] });
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-base font-bold sm:text-lg">{title}</div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm" onClick={() => setEditing({ ...empty })}><Plus className="mr-1 h-4 w-4" />New</Button></DialogTrigger>
          <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto p-4 sm:w-full sm:p-6">
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Create"}</DialogTitle></DialogHeader>
            {editing && <div className="space-y-3">{renderForm(editing, setEditing)}</div>}
            <DialogFooter className="flex-col gap-2 sm:flex-row"><Button onClick={save} className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4" />Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing yet.</div>}
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border bg-card p-3 sm:flex sm:flex-wrap sm:gap-3">
            <div className="col-span-2 min-w-0 sm:col-span-1 sm:flex-1">
              {columns.map((c, i) => (
                <div key={i} className={i === 0 ? "truncate text-sm font-semibold" : "truncate text-xs text-muted-foreground"}>{c.render(r)}</div>
              ))}
            </div>
            <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 sm:col-span-1 sm:contents">
              {visibilityCol && <Switch checked={!!r[visibilityCol]} onCheckedChange={(v) => toggleVis(r.id, v)} />}
              <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...r }); setOpen(true); }}>Edit</Button>
              <Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Services ---------- */
function ServicesEditor() {
  return (
    <CrudList
      title="Services" table="services" visibilityCol="is_active"
      empty={{ title: "", description: "", icon: "Code2", sort_order: 100, is_active: true, price: 0 }}
      columns={[
        { label: "title", render: (r) => r.title },
        { label: "desc", render: (r) => r.description },
        { label: "price", render: (r) => (r.price ? `PKR ${Number(r.price).toLocaleString()}` : "—") },
      ]}
      renderForm={(f, set) => (<>
        <Field label="Title" value={f.title} onChange={(v) => set({ ...f, title: v })} />
        <TextField label="Description" value={f.description} onChange={(v) => set({ ...f, description: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Icon (lucide name)" value={f.icon} onChange={(v) => set({ ...f, icon: v })} />
          <Field label="Sort order" value={f.sort_order} onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })} />
          <Field label="CTA label" value={f.cta_label} onChange={(v) => set({ ...f, cta_label: v })} />
          <Field label="CTA href" value={f.cta_href} onChange={(v) => set({ ...f, cta_href: v })} />
          <Field label="Price (PKR)" value={f.price} onChange={(v) => set({ ...f, price: Number(v) || 0 })} />
        </div>
        <MediaPicker label="Image" value={f.image_url} onChange={(v) => set({ ...f, image_url: v })} />
      </>)}
    />
  );
}

/* ---------- Portfolio ---------- */
function PortfolioEditor() {
  return (
    <CrudList
      title="Portfolio" table="portfolio_projects" visibilityCol="is_active"
      empty={{ project_name: "", client_name: "", category: "", description: "", live_url: "", github_url: "", sort_order: 100, is_active: true, is_featured: false, technologies: [] }}
      columns={[
        { label: "name", render: (r) => r.project_name },
        { label: "cat", render: (r) => `${r.category || "-"} · ${r.client_name || ""}` },
      ]}
      renderForm={(f, set) => (<>
        <Field label="Project name" value={f.project_name} onChange={(v) => set({ ...f, project_name: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client name" value={f.client_name} onChange={(v) => set({ ...f, client_name: v })} />
          <Field label="Category" value={f.category} onChange={(v) => set({ ...f, category: v })} />
          <Field label="Live URL" value={f.live_url} onChange={(v) => set({ ...f, live_url: v })} />
          <Field label="GitHub URL" value={f.github_url} onChange={(v) => set({ ...f, github_url: v })} />
          <Field label="Sort order" value={f.sort_order} onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })} />
        </div>
        <TextField label="Description" value={f.description} onChange={(v) => set({ ...f, description: v })} />
        <Field label="Technologies (comma separated)" value={(f.technologies || []).join(", ")} onChange={(v) => set({ ...f, technologies: v.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
        <MediaPicker label="Cover image (uses After image slot)" value={f.after_image_url} onChange={(v) => set({ ...f, after_image_url: v })} />
        <div className="flex items-center gap-2"><Switch checked={f.is_featured} onCheckedChange={(v) => set({ ...f, is_featured: v })} /><Label>Featured</Label></div>
      </>)}
    />
  );
}

/* ---------- Before / After ---------- */
function BeforeAfterEditor() {
  return (
    <CrudList
      title="Before / After showcase" table="before_after_items" visibilityCol="is_active"
      empty={{ title: "", category: "", before_image_url: "", after_image_url: "", sort_order: 100, is_active: true }}
      columns={[
        { label: "title", render: (r) => r.title },
        { label: "cat", render: (r) => r.category || "-" },
      ]}
      renderForm={(f, set) => (<>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" value={f.title} onChange={(v) => set({ ...f, title: v })} />
          <Field label="Category" value={f.category} onChange={(v) => set({ ...f, category: v })} />
          <Field label="Sort order" value={f.sort_order} onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MediaPicker label="Before image" value={f.before_image_url} onChange={(v) => set({ ...f, before_image_url: v })} />
          <MediaPicker label="After image" value={f.after_image_url} onChange={(v) => set({ ...f, after_image_url: v })} />
        </div>
      </>)}
    />
  );
}

/* ---------- Pricing ---------- */
function PricingEditor() {
  return (
    <CrudList
      title="Pricing plans" table="pricing_plans" visibilityCol="is_active"
      empty={{ name: "", price: "", description: "", features: [], is_popular: false, sort_order: 100, is_active: true, cta_label: "Get Started" }}
      columns={[
        { label: "name", render: (r) => r.name },
        { label: "price", render: (r) => r.price },
      ]}
      renderForm={(f, set) => (<>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={f.name} onChange={(v) => set({ ...f, name: v })} />
          <Field label="Price" value={f.price} onChange={(v) => set({ ...f, price: v })} />
          <Field label="CTA label" value={f.cta_label} onChange={(v) => set({ ...f, cta_label: v })} />
          <Field label="Sort order" value={f.sort_order} onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })} />
        </div>
        <TextField label="Description" value={f.description} onChange={(v) => set({ ...f, description: v })} />
        <TextField label="Features (one per line)" value={(f.features || []).join("\n")} onChange={(v) => set({ ...f, features: v.split("\n").filter(Boolean) })} />
        <div className="flex items-center gap-2"><Switch checked={f.is_popular} onCheckedChange={(v) => set({ ...f, is_popular: v })} /><Label>Popular badge</Label></div>
      </>)}
    />
  );
}

/* ---------- Offers ---------- */
function OffersEditor() {
  return (
    <CrudList
      title="Offers & Promotions" table="offers" orderBy="created_at" visibilityCol="is_active"
      empty={{ title: "", description: "", discount: "", banner_image_url: "", cta_label: "Claim offer", cta_href: "/", is_active: true }}
      columns={[
        { label: "title", render: (r) => r.title },
        { label: "meta", render: (r) => `${r.discount || ""} · ${r.end_date ? "ends " + new Date(r.end_date).toLocaleDateString() : "no end date"}` },
      ]}
      renderForm={(f, set) => (<>
        <Field label="Title" value={f.title} onChange={(v) => set({ ...f, title: v })} />
        <TextField label="Description" value={f.description} onChange={(v) => set({ ...f, description: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Discount label (e.g. 30% OFF)" value={f.discount} onChange={(v) => set({ ...f, discount: v })} />
          <Field label="CTA label" value={f.cta_label} onChange={(v) => set({ ...f, cta_label: v })} />
          <Field label="CTA href" value={f.cta_href} onChange={(v) => set({ ...f, cta_href: v })} />
          <Field label="Start date" type="datetime-local" value={f.start_date?.slice(0, 16)} onChange={(v) => set({ ...f, start_date: v ? new Date(v).toISOString() : null })} />
          <Field label="End date" type="datetime-local" value={f.end_date?.slice(0, 16)} onChange={(v) => set({ ...f, end_date: v ? new Date(v).toISOString() : null })} />
        </div>
        <MediaPicker label="Banner image" value={f.banner_image_url} onChange={(v) => set({ ...f, banner_image_url: v })} />
      </>)}
    />
  );
}

/* ---------- Banners ---------- */
function BannersEditor() {
  return (
    <CrudList
      title="Promotional banners" table="promo_banners" visibilityCol="is_active"
      empty={{ position: "announcement", title: "", description: "", cta_label: "", cta_href: "", is_active: true, sort_order: 100 }}
      columns={[
        { label: "title", render: (r) => `${r.title}` },
        { label: "pos", render: (r) => <Badge variant="outline">{r.position}</Badge> },
      ]}
      renderForm={(f, set) => (<>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Position (announcement / hero / footer)" value={f.position} onChange={(v) => set({ ...f, position: v })} />
          <Field label="Background color (hex)" value={f.background_color} onChange={(v) => set({ ...f, background_color: v })} />
        </div>
        <Field label="Title" value={f.title} onChange={(v) => set({ ...f, title: v })} />
        <TextField label="Description" value={f.description} onChange={(v) => set({ ...f, description: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA label" value={f.cta_label} onChange={(v) => set({ ...f, cta_label: v })} />
          <Field label="CTA href" value={f.cta_href} onChange={(v) => set({ ...f, cta_href: v })} />
          <Field label="Start" type="datetime-local" value={f.start_at?.slice(0, 16)} onChange={(v) => set({ ...f, start_at: v ? new Date(v).toISOString() : null })} />
          <Field label="End" type="datetime-local" value={f.end_at?.slice(0, 16)} onChange={(v) => set({ ...f, end_at: v ? new Date(v).toISOString() : null })} />
        </div>
        <MediaPicker label="Image" value={f.image_url} onChange={(v) => set({ ...f, image_url: v })} />
      </>)}
    />
  );
}

/* ---------- About Editor (singleton) ---------- */
function AboutEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["about_content", "admin"], queryFn: async () => (await supabase.from("about_content").select("*").maybeSingle()).data });
  const [f, setF] = useState<any>({});
  useMemo(() => { if (data && !f.id) setF(data); }, [data]);
  const why: any[] = f.why_us || [];
  const stats: any[] = f.stats || [];
  const save = async () => {
    const p = { ...f }; delete p.created_at; delete p.updated_at;
    const { error } = await supabase.from("about_content").update(p).eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); qc.invalidateQueries({ queryKey: ["about_content"] });
  };
  return (
    <div className="glass-card space-y-4 rounded-2xl p-4 sm:p-6">
      <div className="font-display text-lg font-bold">About Page</div>
      <Field label="Eyebrow" value={f.eyebrow} onChange={(v) => setF({ ...f, eyebrow: v })} />
      <Field label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} />
      <TextField label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} />
      <TextField label="Mission" value={f.mission} onChange={(v) => setF({ ...f, mission: v })} />
      <TextField label="Vision" value={f.vision} onChange={(v) => setF({ ...f, vision: v })} />
      <MediaPicker label="Image" value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} />
      <div>
        <Label>Why Us</Label>
        <div className="mt-2 space-y-2">
          {why.map((w, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Input placeholder="Title" value={w.title} onChange={(e) => { const n = [...why]; n[i] = { ...w, title: e.target.value }; setF({ ...f, why_us: n }); }} />
              <Textarea className="mt-2" placeholder="Description" value={w.description} onChange={(e) => { const n = [...why]; n[i] = { ...w, description: e.target.value }; setF({ ...f, why_us: n }); }} />
              <Button variant="ghost" size="sm" onClick={() => setF({ ...f, why_us: why.filter((_, k) => k !== i) })}><Trash2 className="mr-1 h-4 w-4" />Remove</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setF({ ...f, why_us: [...why, { title: "", description: "" }] })}><Plus className="mr-1 h-4 w-4" />Add</Button>
        </div>
      </div>
      <div>
        <Label>Stats</Label>
        <div className="mt-2 space-y-2">
          {stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Label" value={s.label} onChange={(e) => { const n = [...stats]; n[i] = { ...s, label: e.target.value }; setF({ ...f, stats: n }); }} />
              <Input placeholder="Value" value={s.value} onChange={(e) => { const n = [...stats]; n[i] = { ...s, value: e.target.value }; setF({ ...f, stats: n }); }} />
              <Button variant="ghost" size="icon" onClick={() => setF({ ...f, stats: stats.filter((_, k) => k !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setF({ ...f, stats: [...stats, { label: "", value: "" }] })}><Plus className="mr-1 h-4 w-4" />Add stat</Button>
        </div>
      </div>
      <Button onClick={save}><Save className="mr-2 h-4 w-4" />Save About</Button>
    </div>
  );
}

/* ---------- FAQ ---------- */
function FaqEditor() {
  return (
    <CrudList
      title="FAQs" table="faqs" visibilityCol="is_active"
      empty={{ question: "", answer: "", sort_order: 100, is_active: true }}
      columns={[
        { label: "q", render: (r) => r.question },
        { label: "a", render: (r) => (r.answer || "").slice(0, 80) },
      ]}
      renderForm={(f, set) => (<>
        <Field label="Question" value={f.question} onChange={(v) => set({ ...f, question: v })} />
        <TextField label="Answer" value={f.answer} onChange={(v) => set({ ...f, answer: v })} />
        <Field label="Sort order" value={f.sort_order} onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })} />
      </>)}
    />
  );
}

/* ---------- Reviews ---------- */
function ReviewsEditor() {
  return (
    <CrudList
      title="Reviews & Testimonials" table="testimonials" visibilityCol="is_approved"
      empty={{ client_name: "", company: "", rating: 5, review: "", sort_order: 100, is_approved: true }}
      columns={[
        { label: "name", render: (r) => `${r.client_name} — ${"★".repeat(r.rating || 0)}` },
        { label: "review", render: (r) => (r.review || "").slice(0, 80) },
      ]}
      renderForm={(f, set) => (<>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client name" value={f.client_name} onChange={(v) => set({ ...f, client_name: v })} />
          <Field label="Company" value={f.company} onChange={(v) => set({ ...f, company: v })} />
          <Field label="Project name" value={f.project_name} onChange={(v) => set({ ...f, project_name: v })} />
          <Field label="Rating (1-5)" type="number" value={f.rating} onChange={(v) => set({ ...f, rating: Number(v) || 5 })} />
        </div>
        <TextField label="Review" value={f.review} onChange={(v) => set({ ...f, review: v })} />
        <MediaPicker label="Profile photo" value={f.profile_image_url} onChange={(v) => set({ ...f, profile_image_url: v })} />
      </>)}
    />
  );
}

/* ---------- Media Library ---------- */
function MediaLibrary() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["media_library"],
    queryFn: async () => (await supabase.from("media_library").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const items = (data as any[]).filter((m) => !search || m.file_name?.toLowerCase().includes(search.toLowerCase()));

  const upload = async (file: File) => {
    setUploading(true);
    try { await uploadToWebsiteMedia(file); toast.success("Uploaded"); qc.invalidateQueries({ queryKey: ["media_library"] }); }
    catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };
  const del = async (m: any) => {
    if (!confirm("Delete media?")) return;
    if (m.storage_path) await supabase.storage.from("website-media").remove([m.storage_path]);
    await supabase.from("media_library").delete().eq("id", m.id);
    qc.invalidateQueries({ queryKey: ["media_library"] });
  };

  return (
    <div className="glass-card space-y-4 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-base font-bold sm:text-lg">Media Library</div>
        <div className="flex flex-1 items-center gap-2 sm:flex-none">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-0 flex-1 sm:w-48 sm:flex-none" />
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">{uploading ? "Uploading…" : "Upload"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((m: any) => (
          <div key={m.id} className="group relative overflow-hidden rounded-xl border">
            <img src={m.public_url} alt={m.file_name} className="aspect-square w-full object-cover" />
            <div className="truncate px-2 py-1 text-[10px]">{m.file_name}</div>
            <button onClick={() => del(m)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-0"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No media yet.</div>}
      </div>
    </div>
  );
}

/* ---------- Preview Pane ---------- */
function PreviewPane() {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const widths: Record<string, string> = { desktop: "100%", tablet: "820px", mobile: "390px" };
  return (
    <div className="glass-card space-y-3 rounded-2xl p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={device === "desktop" ? "default" : "outline"} size="sm" onClick={() => setDevice("desktop")}>Desktop</Button>
        <Button variant={device === "tablet" ? "default" : "outline"} size="sm" onClick={() => setDevice("tablet")}>Tablet</Button>
        <Button variant={device === "mobile" ? "default" : "outline"} size="sm" onClick={() => setDevice("mobile")}>Mobile</Button>
        <div className="hidden flex-1 sm:block" />
        <a href="/" target="_blank" rel="noreferrer" className="ml-auto"><Button variant="outline" size="sm"><ExternalLink className="mr-1 h-4 w-4" />Open</Button></a>
      </div>
      <div className="mx-auto overflow-hidden rounded-2xl border bg-background" style={{ width: widths[device], maxWidth: "100%", height: "70vh" }}>
        <iframe src="/" title="preview" className="h-full w-full" />
      </div>
    </div>
  );
}