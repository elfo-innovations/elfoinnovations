import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronRight, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STAGE_ORDER = ["frontend", "backend", "database", "hosting"] as const;
const COMPLETED = new Set(["admin_approved", "sent_to_client", "client_approved"]);

export const Route = createFileRoute("/client/projects")({
  component: ClientProjects,
});

function ClientProjects() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", requirements: "", budget: "", deadline: "" });
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const { data: client } = useQuery({
    queryKey: ["me-client", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("clients").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data } = useQuery({
    queryKey: ["client-projects", client?.id],
    enabled: !!client,
    queryFn: async () =>
      (await supabase.from("projects").select("*, project_stages(*)").eq("client_id", client!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: services } = useQuery({
    queryKey: ["active-services-for-project-form"],
    enabled: open,
    queryFn: async () =>
      (await supabase.from("services").select("id, title, price").eq("is_active", true).order("sort_order")).data ?? [],
  });

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (!client) return toast.error("Client profile missing");
    if (!form.name.trim() || !form.requirements.trim()) return toast.error("Project name and requirements are required");
    setBusy(true);
    try {
      const project_code = `PRJ-${Date.now().toString(36).toUpperCase()}`;
      const selected_services = (services ?? [])
        .filter((s: any) => selectedServiceIds.includes(s.id))
        .map((s: any) => ({ service_id: s.id, title: s.title, price: s.price }));

      const { error } = await supabase.from("projects").insert({
        project_code,
        name: form.name.trim(),
        requirements: form.requirements.trim(),
        client_id: client.id,
        budget: form.budget ? Number(form.budget) : null,
        deadline: form.deadline || null,
        status: "planning" as any,
        selected_services,
      });
      if (error) throw error;
      toast.success(
        selected_services.length > 0
          ? "Requirement submitted — an invoice has been generated for the admin"
          : "Requirement submitted to admin"
      );
      setOpen(false);
      setForm({ name: "", requirements: "", budget: "", deadline: "" });
      setSelectedServiceIds([]);
      qc.invalidateQueries({ queryKey: ["client-projects"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit");
    } finally { setBusy(false); }
  };

  return (
    <DashboardShell role="client">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">My projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Submit new requirements and track progress across the 4 stages.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-full electric-glow"><Plus className="mr-1.5 h-4 w-4" />Submit requirement</Button>
      </div>

      <div className="mt-6 space-y-4">
        {(data ?? []).map((p: any) => {
          const stages = [...(p.project_stages ?? [])].sort((a: any, b: any) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
          const done = stages.filter((s: any) => COMPLETED.has(s.status)).length;
          const total = stages.length || 4;
          return (
            <Link key={p.id} to="/client/project/$id" params={{ id: p.id }} className="glass-card block rounded-2xl p-5 transition hover:border-primary">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary">{p.project_code}</div>
                  <h3 className="mt-1 font-display text-xl font-bold">{p.name}</h3>
                </div>
                <div className="flex items-center gap-2"><Badge>{p.status}</Badge><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span><span>{done}/{total} stages</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-[var(--gradient-primary)]" style={{ width: `${(done / total) * 100}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
        {(!data || data.length === 0) && (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No projects yet. Click "Submit requirement" to send your first brief to the team.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Submit project requirement</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Project name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Marketing website redesign" />
            </div>
            <div className="grid gap-1.5">
              <Label>Requirements *</Label>
              <Textarea rows={6} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Describe what you need. Features, pages, integrations, timeline, references…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Budget (USD)</Label>
                <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Target deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Services needed</Label>
              <p className="text-xs text-muted-foreground">Select the services you'd like — an invoice will be generated automatically for these.</p>
              <div className="mt-1 space-y-2 rounded-xl border p-3">
                {(services ?? []).length === 0 && (
                  <div className="text-xs text-muted-foreground">No services configured yet.</div>
                )}
                {(services ?? []).map((s: any) => (
                  <label key={s.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedServiceIds.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                      <span className="text-sm">{s.title}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {s.price ? `PKR ${Number(s.price).toLocaleString()}` : "—"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to admin"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}