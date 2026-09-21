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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MediaPicker, uploadToWebsiteMedia } from "@/components/web-portal/MediaPicker";
import { DateTimeField } from "@/components/web-portal/DateTimeField";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Image as ImageIcon,
  Home,
  Menu as MenuIcon,
  Sparkles,
  Briefcase,
  DollarSign,
  Gift,
  Megaphone,
  BookOpen,
  HelpCircle,
  Star,
  Images,
  Move,
  Eye,
  Trash2,
  Plus,
  Save,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import type { Database, Tables, TablesUpdate } from "@/integrations/supabase/types";

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
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Manage your public website — content, images, offers, pricing, and layout.
        </p>
      </div>
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
        {/* Mobile / tablet horizontal tab bar */}
        <div className="glass-card mb-4 rounded-2xl p-1.5 sm:p-2 lg:hidden">
          <div className="flex items-center gap-2 px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Pages</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {TABS.length}
            </span>
            <span className="ml-auto text-[10px] font-normal normal-case text-muted-foreground/70">
              Scroll →
            </span>
          </div>
          <nav className="-mx-1.5 flex gap-1 overflow-x-auto px-1.5 pb-1 [scrollbar-width:thin]">
            {TABS.map((t) => (
              <Link
                key={t.id}
                to="/admin/web-portal"
                search={{ tab: t.id }}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap sm:text-sm ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop vertical sidebar */}
        <aside className="glass-card sticky top-6 hidden h-fit max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl p-2 lg:block">
          <div className="flex items-center gap-2 px-3 pt-2 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Pages</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {TABS.length}
            </span>
          </div>
          <nav className="space-y-0.5">
            {TABS.map((t) => (
              <Link
                key={t.id}
                to="/admin/web-portal"
                search={{ tab: t.id }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}
              >
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
        supabase
          .from("testimonials")
          .select("id", { count: "exact", head: true })
          .eq("is_approved", true),
        supabase.from("faqs").select("id", { count: "exact", head: true }),
      ]);
      return {
        sections: s.count ?? 0,
        services: sv.count ?? 0,
        portfolio: po.count ?? 0,
        pricing: pr.count ?? 0,
        offers: of.count ?? 0,
        reviews: tm.count ?? 0,
        faqs: fq.count ?? 0,
      };
    },
  });
  const stats = [
    { l: "Sections", v: data?.sections },
    { l: "Services", v: data?.services },
    { l: "Portfolio", v: data?.portfolio },
    { l: "Pricing plans", v: data?.pricing },
    { l: "Active offers", v: data?.offers },
    { l: "Approved reviews", v: data?.reviews },
    { l: "FAQs", v: data?.faqs },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="glass-card rounded-2xl p-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {s.l}
            </div>
            <div className="mt-2 font-display text-2xl font-bold">{s.v ?? "…"}</div>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <div className="font-display text-lg font-bold">Quick actions</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/admin/web-portal" search={{ tab: "hero" }}>
            <Button variant="outline">Edit hero</Button>
          </Link>
          <Link to="/admin/web-portal" search={{ tab: "offers" }}>
            <Button variant="outline">New offer</Button>
          </Link>
          <Link to="/admin/web-portal" search={{ tab: "banners" }}>
            <Button variant="outline">Banners</Button>
          </Link>
          <Link to="/admin/web-portal" search={{ tab: "sections" }}>
            <Button variant="outline">Reorder sections</Button>
          </Link>
          <a href="/" target="_blank" rel="noreferrer">
            <Button>
              <ExternalLink className="mr-2 h-4 w-4" />
              View site
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sections Manager (drag reorder + enable) ---------- */
function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (h: React.HTMLAttributes<HTMLElement>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {children({ ...attributes, ...listeners } as React.HTMLAttributes<HTMLElement>)}
    </div>
  );
}

function SectionsManager() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["website_sections", "admin"],
    queryFn: async () =>
      (await supabase.from("website_sections").select("*").order("sort_order")).data ?? [],
  });
  const items = data;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [newTitle, setNewTitle] = useState("");

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = items.findIndex((i) => i.id === e.active.id);
    const newIdx = items.findIndex((i) => i.id === e.over!.id);
    const next = arrayMove(items, oldIdx, newIdx);
    qc.setQueryData(["website_sections", "admin"], next);
    for (let i = 0; i < next.length; i++) {
      await supabase
        .from("website_sections")
        .update({ sort_order: (i + 1) * 10 })
        .eq("id", next[i].id);
    }
    qc.invalidateQueries({ queryKey: ["website_sections"] });
    toast.success("Order updated");
  };

  const toggle = async (id: string, is_enabled: boolean) => {
    await supabase.from("website_sections").update({ is_enabled }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["website_sections"] });
  };

  const addCustomSection = async () => {
    if (!newTitle.trim()) return toast.error("Give the new section a name first");
    const key = `custom_${Date.now().toString(36)}`;
    const maxSort = items.reduce((m, i) => Math.max(m, i.sort_order || 0), 0);
    const { error } = await supabase.from("website_sections").insert({
      section_key: key,
      title: newTitle.trim(),
      is_enabled: true,
      sort_order: maxSort + 10,
    });
    if (error) return toast.error(error.message);
    setNewTitle("");
    qc.invalidateQueries({ queryKey: ["website_sections"] });
    toast.success(
      `"${newTitle.trim()}" added — now design it from the Banners tab (position: ${key})`,
    );
  };

  const deleteCustomSection = async (id: string) => {
    if (
      !confirm(
        "Delete this custom section? Its banners in the Banners tab won't be deleted, just unused.",
      )
    )
      return;
    await supabase.from("website_sections").delete().eq("id", id);
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

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3">
        <Input
          placeholder="e.g. Summer Sale, Client Logos, New Feature Spotlight…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="min-w-0 flex-1"
        />
        <Button onClick={addCustomSection}>
          <Plus className="mr-1 h-4 w-4" />
          New section
        </Button>
      </div>
      <p className="-mt-2 mb-4 text-xs text-muted-foreground">
        Creates an empty section you can drag anywhere in the order below. Then go to the{" "}
        <strong>Banners</strong> tab and design its content (image, title, text, button, layout) by
        picking this section as the position.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((s) => {
              const isCustom = s.section_key?.startsWith("custom_");
              return (
                <SortableRow key={s.id} id={s.id}>
                  {(handle) => (
                    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
                      <button {...handle} className="cursor-grab text-muted-foreground">
                        <GripVertical className="h-5 w-5" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-semibold">
                          {s.title}
                          {isCustom && (
                            <Badge variant="outline" className="text-[10px]">
                              custom
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{s.section_key}</div>
                      </div>
                      <Switch checked={s.is_enabled} onCheckedChange={(v) => toggle(s.id, v)} />
                      {isCustom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCustomSection(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </SortableRow>
              );
            })}
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
  const [f, setF] = useState<Partial<Tables<"hero_content">>>({});
  useMemo(() => {
    if (data && Object.keys(f).length === 0) setF(data);
  }, [data]);

  const save = async () => {
    const payload: TablesUpdate<"hero_content"> = { ...f };
    delete payload.created_at;
    delete payload.updated_at;
    const { error } = await supabase
      .from("hero_content")
      .update(payload)
      .eq("id", f.id as string);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["hero_content"] });
  };

  const trust = (f.trust_items as { label: string }[] | null) || [];
  return (
    <div className="glass-card space-y-4 rounded-2xl p-4 sm:p-6">
      <div className="font-display text-lg font-bold">Hero Section</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Eyebrow (small tag)"
          value={f.eyebrow}
          onChange={(v) => setF({ ...f, eyebrow: v })}
        />
        <div>
          <Field
            label="Highlighted phrase(s) — separate multiple with a comma"
            value={f.highlight}
            onChange={(v) => setF({ ...f, highlight: v })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Every match inside the heading gets the blue electric color. Example:{" "}
            <code>Today, Tomorrow</code>
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
            "Space Grotesk",
            "Inter",
            "Poppins",
            "Manrope",
            "Sora",
            "Outfit",
            "DM Sans",
            "Plus Jakarta Sans",
            "Urbanist",
            "Syne",
            "Bricolage Grotesque",
            "Sen",
            "Playfair Display",
            "Fraunces",
            "Cormorant Garamond",
            "Instrument Serif",
            "Bebas Neue",
            "Archivo Black",
          ].map((fn) => (
            <option key={fn} value={fn} style={{ fontFamily: `"${fn}"` }}>
              {fn}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">Applies to the hero heading only.</p>
      </div>
      <TextField
        label="Description"
        value={f.description}
        onChange={(v) => setF({ ...f, description: v })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Primary CTA label"
          value={f.primary_cta_label}
          onChange={(v) => setF({ ...f, primary_cta_label: v })}
        />
        <Field
          label="Primary CTA action ('inquiry' or URL)"
          value={f.primary_cta_action}
          onChange={(v) => setF({ ...f, primary_cta_action: v })}
        />
        <Field
          label="Secondary CTA label"
          value={f.secondary_cta_label}
          onChange={(v) => setF({ ...f, secondary_cta_label: v })}
        />
        <Field
          label="Secondary CTA href"
          value={f.secondary_cta_href}
          onChange={(v) => setF({ ...f, secondary_cta_href: v })}
        />
      </div>
      <MediaPicker
        label="Hero image (optional)"
        value={f.image_url}
        onChange={(v) => setF({ ...f, image_url: v })}
      />
      <div>
        <Label>Trust items</Label>
        <div className="mt-2 space-y-2">
          {trust.map((t, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={t.label}
                onChange={(e) => {
                  const n = [...trust];
                  n[i] = { label: e.target.value };
                  setF({ ...f, trust_items: n });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setF({ ...f, trust_items: trust.filter((_, k) => k !== i) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setF({ ...f, trust_items: [...trust, { label: "" }] })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add item
          </Button>
        </div>
      </div>
      <Button onClick={save}>
        <Save className="mr-2 h-4 w-4" />
        Save Hero
      </Button>
    </div>
  );
}

/* ---------- Navbar Editor ---------- */
function NavbarEditor() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["nav_links", "admin"],
    queryFn: async () =>
      (await supabase.from("nav_links").select("*").order("sort_order")).data ?? [],
  });
  const links = data;
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(
      links,
      links.findIndex((i) => i.id === e.active.id),
      links.findIndex((i) => i.id === e.over!.id),
    );
    qc.setQueryData(["nav_links", "admin"], next);
    for (let i = 0; i < next.length; i++)
      await supabase
        .from("nav_links")
        .update({ sort_order: (i + 1) * 10 })
        .eq("id", next[i].id);
    qc.invalidateQueries({ queryKey: ["nav_links"] });
  };
  const add = async () => {
    if (!label || !href) return;
    await supabase.from("nav_links").insert({ label, href, sort_order: (links.length + 1) * 10 });
    setLabel("");
    setHref("");
    qc.invalidateQueries({ queryKey: ["nav_links"] });
  };
  const update = async (id: string, patch: TablesUpdate<"nav_links">) => {
    await supabase.from("nav_links").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["nav_links"] });
  };
  const del = async (id: string) => {
    await supabase.from("nav_links").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["nav_links"] });
  };

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
                    <button {...handle} className="cursor-grab p-2 text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </button>
                    <Input
                      className="min-w-0 flex-1 basis-[45%]"
                      defaultValue={l.label}
                      onBlur={(e) => update(l.id, { label: e.target.value })}
                    />
                    <Input
                      className="min-w-0 flex-1 basis-[45%]"
                      defaultValue={l.href}
                      onBlur={(e) => update(l.id, { href: e.target.value })}
                    />
                    <Switch
                      checked={l.is_enabled}
                      onCheckedChange={(v) => update(l.id, { is_enabled: v })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => del(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex flex-wrap gap-2 rounded-xl border border-dashed p-3">
        <Input
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="min-w-0 flex-1 basis-[45%]"
        />
        <Input
          placeholder="/path"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          className="min-w-0 flex-1 basis-[45%]"
        />
        <Button onClick={add} className="w-full sm:w-auto">
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

/* ---------- Reusable Field ---------- */
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string | number | null;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
    </div>
  );
}
function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
        rows={3}
      />
    </div>
  );
}

/* ---------- Table-agnostic CRUD plumbing ---------- */
// CrudList works on whichever table its caller names, so the per-table generics of the
// Supabase client can't apply. This is the minimal structural view of the query builder
// that it actually uses; each call site still declares its row type via `CrudList<Row>`.
type CrudError = { message: string } | null;
type CrudTable = {
  select: (cols: string) => {
    order: (col: string, opts: { ascending: boolean }) => PromiseLike<{ data: unknown[] | null }>;
  };
  update: (v: Record<string, unknown>) => {
    eq: (col: string, v: string) => PromiseLike<{ error: CrudError }>;
  };
  insert: (v: Record<string, unknown>) => PromiseLike<{ error: CrudError }>;
  delete: () => { eq: (col: string, v: string) => PromiseLike<{ error: CrudError }> };
};
const crudTable = (table: keyof Database["public"]["Tables"]) =>
  supabase.from(table) as unknown as CrudTable;

/* ---------- Generic CRUD table ---------- */
function CrudList<T extends { id: string }>({
  title,
  table,
  orderBy = "sort_order",
  visibilityCol,
  columns,
  renderForm,
  empty,
  wide,
  allowSaveAndNew,
}: {
  title: string;
  table: keyof Database["public"]["Tables"];
  orderBy?: string;
  visibilityCol?: string;
  columns: { label: string; render: (r: T) => React.ReactNode }[];
  renderForm: (state: Partial<T>, setState: (v: Partial<T>) => void) => React.ReactNode;
  empty: Partial<T>;
  wide?: boolean;
  allowSaveAndNew?: boolean;
}) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: [table, "admin"],
    queryFn: async () =>
      ((await crudTable(table).select("*").order(orderBy, { ascending: true })).data ?? []) as T[],
  });
  const rows = data;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<T> | null>(null);

  const save = async (keepOpen?: boolean) => {
    const p: Record<string, unknown> = { ...editing };
    delete p.created_at;
    delete p.updated_at;
    let err;
    if (p.id) {
      const { error } = await crudTable(table)
        .update(p)
        .eq("id", p.id as string);
      err = error;
    } else {
      const { error } = await crudTable(table).insert(p);
      err = error;
    }
    if (err) return toast.error(err.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: [table] });
    if (keepOpen) {
      setEditing({ ...empty });
    } else {
      setOpen(false);
      setEditing(null);
    }
  };
  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await crudTable(table).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: [table] });
  };
  const toggleVis = async (id: string, v: boolean) => {
    if (!visibilityCol) return;
    await crudTable(table)
      .update({ [visibilityCol]: v })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: [table] });
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-base font-bold sm:text-lg">{title}</div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing({ ...empty })}>
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent
            className={`max-h-[94vh] w-[calc(100vw-1rem)] overflow-y-auto p-4 sm:w-full sm:p-6 ${wide ? "sm:max-w-4xl lg:max-w-6xl" : "max-w-2xl"}`}
          >
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit" : "Create"}</DialogTitle>
            </DialogHeader>
            {editing && <div className="space-y-3">{renderForm(editing, setEditing)}</div>}
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              {allowSaveAndNew && (
                <Button variant="outline" onClick={() => save(true)} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Save &amp; add another
                </Button>
              )}
              <Button onClick={() => save(false)} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" />
                Save &amp; close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing yet.
          </div>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border bg-card p-3 sm:flex sm:flex-wrap sm:gap-3"
          >
            <div className="col-span-2 min-w-0 sm:col-span-1 sm:flex-1">
              {columns.map((c, i) => (
                <div
                  key={i}
                  className={
                    i === 0
                      ? "truncate text-sm font-semibold"
                      : "truncate text-xs text-muted-foreground"
                  }
                >
                  {c.render(r)}
                </div>
              ))}
            </div>
            <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 sm:col-span-1 sm:contents">
              {visibilityCol && (
                <Switch
                  checked={!!(r as Record<string, unknown>)[visibilityCol]}
                  onCheckedChange={(v) => toggleVis(r.id, v)}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing({ ...r });
                  setOpen(true);
                }}
              >
                Edit
              </Button>
              <Button variant="ghost" size="icon" onClick={() => del(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
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
    <CrudList<Tables<"services">>
      title="Services"
      table="services"
      visibilityCol="is_active"
      empty={{
        title: "",
        description: "",
        icon: "Code2",
        sort_order: 100,
        is_active: true,
        price: 0,
      }}
      columns={[
        { label: "title", render: (r) => r.title },
        { label: "desc", render: (r) => r.description },
        {
          label: "price",
          render: (r) => (r.price ? `PKR ${Number(r.price).toLocaleString()}` : "—"),
        },
      ]}
      renderForm={(f, set) => (
        <>
          <Field label="Title" value={f.title} onChange={(v) => set({ ...f, title: v })} />
          <TextField
            label="Description"
            value={f.description}
            onChange={(v) => set({ ...f, description: v })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Icon (lucide name)"
              value={f.icon}
              onChange={(v) => set({ ...f, icon: v })}
            />
            <Field
              label="Sort order"
              value={f.sort_order}
              onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })}
            />
            <Field
              label="CTA label"
              value={f.cta_label}
              onChange={(v) => set({ ...f, cta_label: v })}
            />
            <Field
              label="CTA href"
              value={f.cta_href}
              onChange={(v) => set({ ...f, cta_href: v })}
            />
            <Field
              label="Price (PKR)"
              value={f.price}
              onChange={(v) => set({ ...f, price: Number(v) || 0 })}
            />
          </div>
          <MediaPicker
            label="Image"
            value={f.image_url}
            onChange={(v) => set({ ...f, image_url: v })}
          />
        </>
      )}
    />
  );
}

/* ---------- Portfolio ---------- */
function PortfolioEditor() {
  return (
    <CrudList<Tables<"portfolio_projects">>
      title="Portfolio"
      table="portfolio_projects"
      visibilityCol="is_active"
      empty={{
        project_name: "",
        client_name: "",
        category: "",
        description: "",
        live_url: "",
        github_url: "",
        sort_order: 100,
        is_active: true,
        is_featured: false,
        technologies: [],
      }}
      columns={[
        { label: "name", render: (r) => r.project_name },
        { label: "cat", render: (r) => `${r.category || "-"} · ${r.client_name || ""}` },
      ]}
      renderForm={(f, set) => (
        <>
          <Field
            label="Project name"
            value={f.project_name}
            onChange={(v) => set({ ...f, project_name: v })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Client name"
              value={f.client_name}
              onChange={(v) => set({ ...f, client_name: v })}
            />
            <Field
              label="Category"
              value={f.category}
              onChange={(v) => set({ ...f, category: v })}
            />
            <Field
              label="Live URL"
              value={f.live_url}
              onChange={(v) => set({ ...f, live_url: v })}
            />
            <Field
              label="GitHub URL"
              value={f.github_url}
              onChange={(v) => set({ ...f, github_url: v })}
            />
            <Field
              label="Sort order"
              value={f.sort_order}
              onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })}
            />
          </div>
          <TextField
            label="Description"
            value={f.description}
            onChange={(v) => set({ ...f, description: v })}
          />
          <Field
            label="Technologies (comma separated)"
            value={(f.technologies || []).join(", ")}
            onChange={(v) =>
              set({
                ...f,
                technologies: v
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
          />
          <MediaPicker
            label="Cover image (uses After image slot)"
            value={f.after_image_url}
            onChange={(v) => set({ ...f, after_image_url: v })}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={f.is_featured}
              onCheckedChange={(v) => set({ ...f, is_featured: v })}
            />
            <Label>Featured</Label>
          </div>
        </>
      )}
    />
  );
}

/* ---------- Before / After ---------- */
function BeforeAfterEditor() {
  return (
    <CrudList<Tables<"before_after_items">>
      title="Before / After showcase"
      table="before_after_items"
      visibilityCol="is_active"
      empty={{
        title: "",
        category: "",
        before_image_url: "",
        after_image_url: "",
        sort_order: 100,
        is_active: true,
      }}
      columns={[
        { label: "title", render: (r) => r.title },
        { label: "cat", render: (r) => r.category || "-" },
      ]}
      renderForm={(f, set) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" value={f.title} onChange={(v) => set({ ...f, title: v })} />
            <Field
              label="Category"
              value={f.category}
              onChange={(v) => set({ ...f, category: v })}
            />
            <Field
              label="Sort order"
              value={f.sort_order}
              onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MediaPicker
              label="Before image"
              value={f.before_image_url}
              onChange={(v) => set({ ...f, before_image_url: v })}
            />
            <MediaPicker
              label="After image"
              value={f.after_image_url}
              onChange={(v) => set({ ...f, after_image_url: v })}
            />
          </div>
        </>
      )}
    />
  );
}

/* ---------- Pricing ---------- */
function PricingEditor() {
  return (
    <CrudList<Tables<"pricing_plans">>
      title="Pricing plans"
      table="pricing_plans"
      visibilityCol="is_active"
      empty={{
        name: "",
        price: "",
        description: "",
        features: [],
        is_popular: false,
        sort_order: 100,
        is_active: true,
        cta_label: "Get Started",
      }}
      columns={[
        { label: "name", render: (r) => r.name },
        { label: "price", render: (r) => r.price },
      ]}
      renderForm={(f, set) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={f.name} onChange={(v) => set({ ...f, name: v })} />
            <Field label="Price" value={f.price} onChange={(v) => set({ ...f, price: v })} />
            <Field
              label="CTA label"
              value={f.cta_label}
              onChange={(v) => set({ ...f, cta_label: v })}
            />
            <Field
              label="Sort order"
              value={f.sort_order}
              onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })}
            />
          </div>
          <TextField
            label="Description"
            value={f.description}
            onChange={(v) => set({ ...f, description: v })}
          />
          <TextField
            label="Features (one per line)"
            value={(f.features || []).join("\n")}
            onChange={(v) => set({ ...f, features: v.split("\n").filter(Boolean) })}
          />
          <div className="flex items-center gap-2">
            <Switch checked={f.is_popular} onCheckedChange={(v) => set({ ...f, is_popular: v })} />
            <Label>Popular badge</Label>
          </div>
        </>
      )}
    />
  );
}

/* ---------- Offers ---------- */
function OffersEditor() {
  return (
    <CrudList<Tables<"offers">>
      title="Offers & Promotions"
      table="offers"
      orderBy="created_at"
      visibilityCol="is_active"
      empty={{
        title: "",
        description: "",
        discount: "",
        banner_image_url: "",
        cta_label: "Claim offer",
        cta_href: "/",
        is_active: true,
      }}
      columns={[
        { label: "title", render: (r) => r.title },
        {
          label: "meta",
          render: (r) =>
            `${r.discount || ""} · ${r.end_date ? "ends " + new Date(r.end_date).toLocaleDateString() : "no end date"}`,
        },
      ]}
      renderForm={(f, set) => (
        <>
          <Field label="Title" value={f.title} onChange={(v) => set({ ...f, title: v })} />
          <TextField
            label="Description"
            value={f.description}
            onChange={(v) => set({ ...f, description: v })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Discount label (e.g. 30% OFF)"
              value={f.discount}
              onChange={(v) => set({ ...f, discount: v })}
            />
            <Field
              label="CTA label"
              value={f.cta_label}
              onChange={(v) => set({ ...f, cta_label: v })}
            />
            <Field
              label="CTA href"
              value={f.cta_href}
              onChange={(v) => set({ ...f, cta_href: v })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateTimeField
              label="Start date"
              value={f.start_date}
              onChange={(v) => set({ ...f, start_date: v })}
            />
            <DateTimeField
              label="End date"
              value={f.end_date}
              onChange={(v) => set({ ...f, end_date: v })}
            />
          </div>
          <MediaPicker
            label="Banner image"
            value={f.banner_image_url}
            onChange={(v) => set({ ...f, banner_image_url: v })}
          />
        </>
      )}
    />
  );
}

/* ---------- Banners ---------- */
function PromoSettingsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["promo_settings"],
    queryFn: async () =>
      (await supabase.from("promo_settings").select("*").limit(1).maybeSingle()).data,
  });
  const { data: heroSlideCount = 0 } = useQuery({
    queryKey: ["promo_banners", "hero_slider", "count"],
    queryFn: async () =>
      (
        await supabase
          .from("promo_banners")
          .select("id", { count: "exact", head: true })
          .eq("position", "hero_slider")
          .eq("is_active", true)
      ).count ?? 0,
  });
  const [local, setLocal] = useState<Partial<Tables<"promo_settings">> | null>(null);
  const settings = local ?? data;
  const [saving, setSaving] = useState(false);

  if (!settings) return null;

  const save = async (patch: Partial<Tables<"promo_settings">>) => {
    const next = { ...settings, ...patch };
    setLocal(next);
    setSaving(true);
    const { error } = settings.id
      ? await supabase.from("promo_settings").update(patch).eq("id", settings.id)
      : await supabase.from("promo_settings").insert(patch);
    setSaving(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["promo_settings"] });
  };

  const heroReady = settings.hero_mode !== "slider" || heroSlideCount >= 4;

  return (
    <div className="glass-card space-y-6 rounded-2xl p-4 sm:p-6">
      <div>
        <div className="font-display text-base font-bold sm:text-lg">Promotions</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Each of these is independent — turn on only what you need. Everything reverts to normal
          the instant you switch it back off.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <div className="text-sm font-semibold">Promo surface style</div>
          <p className="text-xs text-muted-foreground">
            Dark or light background for the marquee, slider, and banners.
          </p>
        </div>
        <select
          value={settings.theme}
          onChange={(e) => save({ theme: e.target.value })}
          className="flex h-9 w-32 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      {/* Marquee */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Scrolling headline (marquee)</div>
            <p className="text-xs text-muted-foreground">
              A ticker strip across the very top of the site.
            </p>
          </div>
          <Switch
            checked={!!settings.marquee_enabled}
            disabled={saving}
            onCheckedChange={(v) => save({ marquee_enabled: v })}
          />
        </div>
        {settings.marquee_enabled && (
          <div className="mt-3 flex items-center gap-3">
            <p className="flex-1 truncate text-sm text-muted-foreground">
              {settings.marquee_text || "(no headline set yet)"}
            </p>
            <MarqueeModal value={settings.marquee_text} onSave={(v) => save({ marquee_text: v })} />
          </div>
        )}
      </div>

      {/* Hero mode */}
      <div className="rounded-xl border p-4">
        <div className="text-sm font-semibold">Homepage hero</div>
        <p className="text-xs text-muted-foreground">
          Replace the normal hero with a slider or a single promo image.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { v: "off", l: "Normal (off)" },
            { v: "slider", l: "Slider" },
            { v: "image", l: "Single image" },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => save({ hero_mode: opt.v })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${settings.hero_mode === opt.v ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"}`}
            >
              {opt.l}
            </button>
          ))}
        </div>

        {settings.hero_mode === "slider" && (
          <div
            className={`mt-3 rounded-lg border p-3 text-xs ${heroReady ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"}`}
          >
            {heroReady
              ? `✓ ${heroSlideCount} slide images added — slider is ready.`
              : `⚠ Only ${heroSlideCount}/4 slide images added. Add at least 4 images below, or the site will show the normal hero instead.`}
          </div>
        )}
        {settings.hero_mode === "slider" && <BulkHeroUpload />}

        {settings.hero_mode === "image" && (
          <div className="mt-3">
            <MediaPicker
              label="Hero image"
              value={settings.hero_image_url}
              onChange={(v) => save({ hero_image_url: v })}
            />
          </div>
        )}
      </div>
      {/* Site-wide theme color */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Site-wide accent color</div>
            <p className="text-xs text-muted-foreground">
              Overrides the primary color everywhere — buttons, links, glows — to match the deal.
            </p>
          </div>
          <Switch
            checked={!!settings.theme_color_enabled}
            disabled={saving}
            onCheckedChange={(v) => save({ theme_color_enabled: v })}
          />
        </div>
        {settings.theme_color_enabled && (
          <div className="mt-3 flex items-center gap-3">
            <input
              type="color"
              value={settings.theme_color || "#2a63ff"}
              onChange={(e) => save({ theme_color: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-md border"
            />
            <Input
              value={settings.theme_color}
              onChange={(e) => setLocal({ ...settings, theme_color: e.target.value })}
              onBlur={() => save({ theme_color: settings.theme_color })}
              placeholder="#2a63ff"
              className="max-w-[140px] font-mono"
            />
          </div>
        )}
      </div>

      {/* Background & navbar color (independent from the accent color above) */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Background &amp; navbar color</div>
            <p className="text-xs text-muted-foreground">
              A separate color for the page background and navbar — buttons/links stay controlled by
              the accent color above.
            </p>
          </div>
          <Switch
            checked={!!settings.bg_color_enabled}
            disabled={saving}
            onCheckedChange={(v) => save({ bg_color_enabled: v })}
          />
        </div>
        {settings.bg_color_enabled && (
          <div className="mt-3 flex items-center gap-3">
            <input
              type="color"
              value={settings.bg_color || "#0a1128"}
              onChange={(e) => save({ bg_color: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-md border"
            />
            <Input
              value={settings.bg_color}
              onChange={(e) => setLocal({ ...settings, bg_color: e.target.value })}
              onBlur={() => save({ bg_color: settings.bg_color })}
              placeholder="#0a1128"
              className="max-w-[140px] font-mono"
            />
          </div>
        )}
      </div>

      {/* Logo override */}
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Deal-specific logo</div>
            <p className="text-xs text-muted-foreground">
              Show a different logo (e.g. with a sale badge) instead of the normal one.
            </p>
          </div>
          <Switch
            checked={!!settings.logo_enabled}
            disabled={saving}
            onCheckedChange={(v) => save({ logo_enabled: v })}
          />
        </div>
        {settings.logo_enabled && (
          <div className="mt-3">
            <MediaPicker
              label="Logo image"
              value={settings.logo_url}
              onChange={(v) => save({ logo_url: v })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function BannerLivePreview({
  f,
  set,
}: {
  f: Partial<Tables<"promo_banners">>;
  set: (v: Partial<Tables<"promo_banners">>) => void;
}) {
  const layout = f.layout || "full";
  const isVideo = f.media_type === "video";
  const bg = f.background_color || "#0a1128";
  const [uploading, setUploading] = useState(false);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToWebsiteMedia(file);
      set({ ...f, image_url: url });
      toast.success("Image added");
    } catch (e) {
      toast.error(getErrorMessage(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const media = f.image_url ? (
    isVideo ? (
      <video
        src={f.image_url}
        className="h-full w-full object-cover"
        muted
        loop
        autoPlay
        playsInline
      />
    ) : (
      <img src={f.image_url} alt="" className="h-full w-full object-cover" />
    )
  ) : (
    <label className="group flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground transition hover:bg-muted/70">
      {uploading ? (
        <span className="text-xs">Uploading…</span>
      ) : (
        <>
          <ImageIcon className="h-6 w-6 opacity-40 transition group-hover:opacity-70" />
          <span className="text-xs font-medium group-hover:text-foreground">
            Click to add image
          </span>
        </>
      )}
      <input
        type="file"
        accept={isVideo ? "video/mp4" : "image/*"}
        className="hidden"
        disabled={uploading}
        onChange={(e) => pickImage(e.target.files?.[0])}
      />
    </label>
  );

  const LAYOUTS = [
    { v: "full", l: "Full-width" },
    { v: "split_left", l: "Image left" },
    { v: "split_right", l: "Image right" },
  ];

  const TitleInput = ({ className }: { className: string }) => (
    <input
      value={f.title || ""}
      onChange={(e) => set({ ...f, title: e.target.value })}
      placeholder="Click here to type a banner title…"
      className={`w-full border-none bg-transparent font-display font-bold text-white outline-none placeholder:text-white/40 ${className}`}
    />
  );
  const DescInput = ({ className }: { className: string }) => (
    <textarea
      value={f.description || ""}
      onChange={(e) => set({ ...f, description: e.target.value })}
      placeholder="Click here to type a description — or one service per line, e.g. For Fashion / For Adventure"
      rows={2}
      className={`w-full resize-none border-none bg-transparent text-white outline-none placeholder:text-white/40 ${className}`}
    />
  );
  const CtaInput = () => (
    <input
      value={f.cta_label || ""}
      onChange={(e) => set({ ...f, cta_label: e.target.value })}
      placeholder="Button text"
      className="mt-3 w-fit min-w-[90px] rounded-full bg-[var(--gradient-primary,linear-gradient(135deg,#3b6bff,#5fa8ff))] px-4 py-1.5 text-center text-xs font-semibold text-white shadow outline-none placeholder:text-white/70"
    />
  );

  const serviceLines = (f.description || "")
    .split("\n")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const showAsChips = serviceLines.length > 1;

  const hAlign = f.text_h_align || "left";
  const vAlign = f.text_v_align || "bottom";
  const overlayPosClass =
    `${vAlign === "top" ? "items-start" : vAlign === "center" ? "items-center" : "items-end"} ` +
    `${hAlign === "left" ? "justify-start text-left" : hAlign === "center" ? "justify-center text-center" : "justify-end text-right"}`;
  const heightStyle = f.height_px ? { height: `${f.height_px}px` } : {};

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label>Live preview — click any text or the image to edit it directly</Label>
      </div>
      <div className="overflow-hidden rounded-xl border shadow-sm">
        {/* mini browser chrome + layout switch, right on the canvas */}
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/60 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-red-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          <span className="truncate rounded bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
            elfoinnovations.com
          </span>
          <div className="ml-auto flex gap-1">
            {LAYOUTS.map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => set({ ...f, layout: opt.v })}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${layout === opt.v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-accent"}`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {layout === "full" ? (
          <div
            className="relative w-full bg-muted"
            style={{ aspectRatio: f.height_px ? undefined : "21 / 9", ...heightStyle }}
          >
            {media}
            {f.image_url && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            )}
            <div className={`absolute inset-0 flex flex-col gap-1 p-4 sm:p-6 ${overlayPosClass}`}>
              <TitleInput className="text-lg leading-tight sm:text-2xl" />
              {!showAsChips && <DescInput className="max-w-md text-xs sm:text-sm" />}
              <CtaInput />
            </div>
          </div>
        ) : (
          <div
            className={`flex flex-col sm:flex-row ${layout === "split_right" ? "sm:flex-row-reverse" : ""}`}
            style={f.height_px ? heightStyle : undefined}
          >
            <div
              className={`w-full bg-muted sm:w-1/2 ${f.height_px ? "" : "aspect-[16/10] sm:aspect-auto"}`}
            >
              {media}
            </div>
            <div
              className="flex w-full flex-col justify-center gap-1 p-5 sm:w-1/2 sm:p-8"
              style={{ background: bg }}
            >
              <TitleInput className="text-lg leading-tight sm:text-2xl" />
              {!showAsChips && <DescInput className="text-xs sm:text-sm" />}
              {showAsChips && (
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {serviceLines.slice(0, 4).map((line: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white"
                    >
                      <span className="truncate">{line}</span>
                      <span className="shrink-0 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">
                        →
                      </span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => set({ ...f, description: [...serviceLines, ""].join("\n") })}
                    className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-white/25 px-3 py-2 text-xs text-white/60 hover:border-white/50 hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
              )}
              <CtaInput />
            </div>
          </div>
        )}
      </div>

      {/* Size + text placement controls */}
      <div className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs">Height (px) — leave blank for automatic</Label>
          <Input
            type="number"
            placeholder="e.g. 420"
            value={f.height_px ?? ""}
            onChange={(e) =>
              set({ ...f, height_px: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        {layout === "full" && (
          <div className="grid gap-1.5">
            <Label className="text-xs">Text position on the image</Label>
            <div className="grid w-fit grid-cols-3 gap-1 rounded-lg border p-1">
              {(["top", "center", "bottom"] as const).map((v) =>
                (["left", "center", "right"] as const).map((h) => (
                  <button
                    key={`${v}-${h}`}
                    type="button"
                    onClick={() => set({ ...f, text_v_align: v, text_h_align: h })}
                    className={`flex h-7 w-9 items-center justify-center rounded ${vAlign === v && hAlign === h ? "bg-primary" : "bg-muted hover:bg-accent"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${vAlign === v && hAlign === h ? "bg-primary-foreground" : "bg-muted-foreground/50"}`}
                    />
                  </button>
                )),
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Use the layout buttons top-right of the preview to switch between full-width and
        image-left/right. Set a custom height above, and for full-width banners pick where the text
        sits with the 3×3 grid. Put each service on its own line in the description to turn it into
        small cards instead of a paragraph.
      </p>
    </div>
  );
}

function BulkHeroUpload() {
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    setFiles(picked.slice(0, 12));
    e.target.value = "";
  };

  const upload = async () => {
    if (files.length < 4) return toast.error("Pick at least 4 images");
    if (files.length > 12) return toast.error("Maximum 12 images at once");
    setUploading(true);
    setProgress(0);
    try {
      const { count } = await supabase
        .from("promo_banners")
        .select("id", { count: "exact", head: true })
        .eq("position", "hero_slider");
      let sort = (count ?? 0) * 10 + 100;
      for (const file of files) {
        const url = await uploadToWebsiteMedia(file);
        await supabase.from("promo_banners").insert({
          position: "hero_slider",
          media_type: "image",
          image_url: url,
          title: "",
          description: "",
          is_active: true,
          sort_order: sort,
          layout: "full",
        });
        sort += 10;
        setProgress((p) => p + 1);
      }
      toast.success(`${files.length} slides added`);
      setFiles([]);
      qc.invalidateQueries({ queryKey: ["promo_banners", "admin"] });
      qc.invalidateQueries({ queryKey: ["promo_banners", "hero_slider", "count"] });
    } catch (e) {
      toast.error(getErrorMessage(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-dashed p-3">
      <div className="text-xs font-semibold">Quick add: multiple slide images at once</div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Pick 4–12 images — each becomes its own slide, in the order picked.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
          Choose images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onPick}
            disabled={uploading}
          />
        </label>
        {files.length > 0 && (
          <span
            className={`text-xs font-medium ${files.length < 4 ? "text-amber-600" : "text-emerald-600"}`}
          >
            {files.length} selected {files.length < 4 ? "(need 4+)" : ""}
          </span>
        )}
        <Button
          size="sm"
          onClick={upload}
          disabled={uploading || files.length < 4}
          className="ml-auto"
        >
          {uploading
            ? `Uploading ${progress}/${files.length}…`
            : `Upload ${files.length || ""} slides`}
        </Button>
      </div>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <span
              key={i}
              className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {f.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MarqueeModal({ value, onSave }: { value?: string | null; onSave: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setDraft(value ?? "");
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Edit headline
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marquee headline</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="AZADI SALE ENDS IN... · LIMITED STOCK LEFT!"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PROMO_POSITIONS = [
  { value: "hero_slider", label: "Hero slider (top, replaces the normal hero)" },
  { value: "after_hero", label: "Banner — after the hero slider" },
  { value: "after_services", label: "Banner — after Services section" },
  {
    value: "work_left",
    label: "Services in action — card on the left (replaces one project card)",
  },
  {
    value: "work_right",
    label: "Services in action — card on the right (replaces one project card)",
  },
  { value: "announcement", label: "Announcement bar (always-on strip)" },
  { value: "footer", label: "Footer banner" },
];

function BannersEditor() {
  const { data: customSections } = useQuery({
    queryKey: ["website_sections", "custom", "admin"],
    queryFn: async () =>
      (
        await supabase.from("website_sections").select("section_key,title").order("sort_order")
      ).data?.filter((s) => s.section_key?.startsWith("custom_")) ?? [],
  });
  const positionOptions = [
    ...PROMO_POSITIONS,
    ...(customSections ?? []).map((s) => ({
      value: s.section_key,
      label: `Section: ${s.title}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <PromoSettingsPanel />
      <CrudList<Tables<"promo_banners">>
        title="Promotional banners & slides"
        table="promo_banners"
        visibilityCol="is_active"
        wide
        allowSaveAndNew
        empty={{
          position: "hero_slider",
          media_type: "image",
          title: "",
          description: "",
          image_url: "",
          cta_label: "",
          cta_href: "",
          is_active: true,
          sort_order: 100,
          height_px: null,
          text_h_align: "left",
          text_v_align: "bottom",
        }}
        columns={[
          { label: "title", render: (r) => `${r.title || "(untitled)"}` },
          {
            label: "pos",
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline">{r.position}</Badge>
                <Badge variant="secondary" className="capitalize">
                  {r.media_type || "image"}
                </Badge>
              </div>
            ),
          },
        ]}
        renderForm={(f, set) => (
          <>
            <BannerLivePreview f={f} set={set} />

            <div className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Position</Label>
                <select
                  value={f.position}
                  onChange={(e) => set({ ...f, position: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {positionOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Media type</Label>
                <select
                  value={f.media_type || "image"}
                  onChange={(e) => set({ ...f, media_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <Field
                label="CTA link (where the button goes)"
                value={f.cta_href}
                onChange={(v) => set({ ...f, cta_href: v })}
              />
              <Field
                label="Background color (hex, for image left/right panel)"
                value={f.background_color}
                onChange={(v) => set({ ...f, background_color: v })}
              />
              <DateTimeField
                label="Start"
                value={f.start_at}
                onChange={(v) => set({ ...f, start_at: v })}
              />
              <DateTimeField
                label="End"
                value={f.end_at}
                onChange={(v) => set({ ...f, end_at: v })}
              />
            </div>
          </>
        )}
      />
    </div>
  );
}

/* ---------- About Editor (singleton) ---------- */
function AboutEditor() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["about_content", "admin"],
    queryFn: async () => (await supabase.from("about_content").select("*").maybeSingle()).data,
  });
  const [f, setF] = useState<Partial<Tables<"about_content">>>({});
  useMemo(() => {
    if (data && !f.id) setF(data);
  }, [data]);
  const why = (f.why_us as { title: string; description: string }[] | null) || [];
  const stats = (f.stats as { label: string; value: string }[] | null) || [];
  const save = async () => {
    const p: TablesUpdate<"about_content"> = { ...f };
    delete p.created_at;
    delete p.updated_at;
    const { error } = await supabase
      .from("about_content")
      .update(p)
      .eq("id", f.id as string);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["about_content"] });
  };
  return (
    <div className="glass-card space-y-4 rounded-2xl p-4 sm:p-6">
      <div className="font-display text-lg font-bold">About Page</div>
      <Field label="Eyebrow" value={f.eyebrow} onChange={(v) => setF({ ...f, eyebrow: v })} />
      <Field label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} />
      <TextField
        label="Description"
        value={f.description}
        onChange={(v) => setF({ ...f, description: v })}
      />
      <TextField label="Mission" value={f.mission} onChange={(v) => setF({ ...f, mission: v })} />
      <TextField label="Vision" value={f.vision} onChange={(v) => setF({ ...f, vision: v })} />
      <MediaPicker
        label="Image"
        value={f.image_url}
        onChange={(v) => setF({ ...f, image_url: v })}
      />
      <div>
        <Label>Why Us</Label>
        <div className="mt-2 space-y-2">
          {why.map((w, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Input
                placeholder="Title"
                value={w.title}
                onChange={(e) => {
                  const n = [...why];
                  n[i] = { ...w, title: e.target.value };
                  setF({ ...f, why_us: n });
                }}
              />
              <Textarea
                className="mt-2"
                placeholder="Description"
                value={w.description}
                onChange={(e) => {
                  const n = [...why];
                  n[i] = { ...w, description: e.target.value };
                  setF({ ...f, why_us: n });
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setF({ ...f, why_us: why.filter((_, k) => k !== i) })}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setF({ ...f, why_us: [...why, { title: "", description: "" }] })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
      <div>
        <Label>Stats</Label>
        <div className="mt-2 space-y-2">
          {stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Label"
                value={s.label}
                onChange={(e) => {
                  const n = [...stats];
                  n[i] = { ...s, label: e.target.value };
                  setF({ ...f, stats: n });
                }}
              />
              <Input
                placeholder="Value"
                value={s.value}
                onChange={(e) => {
                  const n = [...stats];
                  n[i] = { ...s, value: e.target.value };
                  setF({ ...f, stats: n });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setF({ ...f, stats: stats.filter((_, k) => k !== i) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setF({ ...f, stats: [...stats, { label: "", value: "" }] })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add stat
          </Button>
        </div>
      </div>
      <Button onClick={save}>
        <Save className="mr-2 h-4 w-4" />
        Save About
      </Button>
    </div>
  );
}

/* ---------- FAQ ---------- */
function FaqEditor() {
  return (
    <CrudList<Tables<"faqs">>
      title="FAQs"
      table="faqs"
      visibilityCol="is_active"
      empty={{ question: "", answer: "", sort_order: 100, is_active: true }}
      columns={[
        { label: "q", render: (r) => r.question },
        { label: "a", render: (r) => (r.answer || "").slice(0, 80) },
      ]}
      renderForm={(f, set) => (
        <>
          <Field label="Question" value={f.question} onChange={(v) => set({ ...f, question: v })} />
          <TextField label="Answer" value={f.answer} onChange={(v) => set({ ...f, answer: v })} />
          <Field
            label="Sort order"
            value={f.sort_order}
            onChange={(v) => set({ ...f, sort_order: Number(v) || 0 })}
          />
        </>
      )}
    />
  );
}

/* ---------- Reviews ---------- */
function ReviewsEditor() {
  return (
    <CrudList<Tables<"testimonials">>
      title="Reviews & Testimonials"
      table="testimonials"
      visibilityCol="is_approved"
      empty={{
        client_name: "",
        company: "",
        rating: 5,
        review: "",
        sort_order: 100,
        is_approved: true,
      }}
      columns={[
        { label: "name", render: (r) => `${r.client_name} — ${"★".repeat(r.rating || 0)}` },
        { label: "review", render: (r) => (r.review || "").slice(0, 80) },
      ]}
      renderForm={(f, set) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Client name"
              value={f.client_name}
              onChange={(v) => set({ ...f, client_name: v })}
            />
            <Field label="Company" value={f.company} onChange={(v) => set({ ...f, company: v })} />
            <Field
              label="Project name"
              value={f.project_name}
              onChange={(v) => set({ ...f, project_name: v })}
            />
            <Field
              label="Rating (1-5)"
              type="number"
              value={f.rating}
              onChange={(v) => set({ ...f, rating: Number(v) || 5 })}
            />
          </div>
          <TextField label="Review" value={f.review} onChange={(v) => set({ ...f, review: v })} />
          <MediaPicker
            label="Profile photo"
            value={f.profile_image_url}
            onChange={(v) => set({ ...f, profile_image_url: v })}
          />
        </>
      )}
    />
  );
}

/* ---------- Media Library ---------- */
function MediaLibrary() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["media_library"],
    queryFn: async () =>
      (await supabase.from("media_library").select("*").order("created_at", { ascending: false }))
        .data ?? [],
  });
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const items = data.filter(
    (m) => !search || m.file_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const upload = async (file: File) => {
    setUploading(true);
    try {
      await uploadToWebsiteMedia(file);
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["media_library"] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };
  const del = async (m: Tables<"media_library">) => {
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
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 sm:w-48 sm:flex-none"
          />
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">{uploading ? "Uploading…" : "Upload"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((m) => (
          <div key={m.id} className="group relative overflow-hidden rounded-xl border">
            <img
              src={m.public_url ?? undefined}
              alt={m.file_name}
              className="aspect-square w-full object-cover"
            />
            <div className="truncate px-2 py-1 text-[10px]">{m.file_name}</div>
            <button
              onClick={() => del(m)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No media yet.
          </div>
        )}
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
        <Button
          variant={device === "desktop" ? "default" : "outline"}
          size="sm"
          onClick={() => setDevice("desktop")}
        >
          Desktop
        </Button>
        <Button
          variant={device === "tablet" ? "default" : "outline"}
          size="sm"
          onClick={() => setDevice("tablet")}
        >
          Tablet
        </Button>
        <Button
          variant={device === "mobile" ? "default" : "outline"}
          size="sm"
          onClick={() => setDevice("mobile")}
        >
          Mobile
        </Button>
        <div className="hidden flex-1 sm:block" />
        <a href="/" target="_blank" rel="noreferrer" className="ml-auto">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-1 h-4 w-4" />
            Open
          </Button>
        </a>
      </div>
      <div
        className="mx-auto overflow-hidden rounded-2xl border bg-background"
        style={{ width: widths[device], maxWidth: "100%", height: "70vh" }}
      >
        <iframe src="/" title="preview" className="h-full w-full" />
      </div>
    </div>
  );
}
