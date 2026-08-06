import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, FileText, Download } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/client/invoices")({
  component: ClientInvoices,
});

function ClientInvoices() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", amount: "", currency: "USD", note: "", project_id: "" });

  const { data: client } = useQuery({
    queryKey: ["me-client", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("clients").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: projects } = useQuery({
    queryKey: ["client-projects-list", client?.id],
    enabled: !!client,
    queryFn: async () => (await supabase.from("projects").select("id, name, project_code").eq("client_id", client!.id)).data ?? [],
  });

  const { data: invoices } = useQuery({
    queryKey: ["client-invoices", client?.id],
    enabled: !!client,
    queryFn: async () => (await supabase.from("client_invoices").select("*").eq("client_id", client!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const submit = async () => {
    if (!client) return toast.error("Client profile missing");
    if (!form.title.trim()) return toast.error("Title is required");
    setBusy(true);
    try {
      let file_url: string | null = null;
      let file_name: string | null = null;
      if (file) {
        const path = `${client.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("client-invoices").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("client-invoices").createSignedUrl(path, 60 * 60 * 24 * 365);
        file_url = signed?.signedUrl ?? null;
        file_name = file.name;
      }
      const { error } = await supabase.from("client_invoices").insert({
        client_id: client.id,
        project_id: form.project_id || null,
        title: form.title.trim(),
        amount: form.amount ? Number(form.amount) : null,
        currency: form.currency,
        note: form.note.trim() || null,
        file_url,
        file_name,
        status: "submitted",
      });
      if (error) throw error;
      toast.success("Invoice sent to admin");
      setOpen(false);
      setForm({ title: "", amount: "", currency: "USD", note: "", project_id: "" });
      setFile(null);
      qc.invalidateQueries({ queryKey: ["client-invoices"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit");
    } finally { setBusy(false); }
  };

  return (
    <DashboardShell role="client">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Invoices &amp; receipts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Send payment proof or invoices to the admin.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-full electric-glow"><Plus className="mr-1.5 h-4 w-4" />Submit invoice</Button>
      </div>

      <div className="mt-6 grid gap-3">
        {(invoices ?? []).map((inv: any) => (
          <div key={inv.id} className="glass-card rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{inv.title}</div>
                {inv.amount && <div className="text-xs text-muted-foreground">{inv.currency} {Number(inv.amount).toFixed(2)}</div>}
                {inv.note && <div className="mt-1 text-xs text-muted-foreground">{inv.note}</div>}
              </div>
              <Badge variant="outline" className="capitalize">{inv.status}</Badge>
            </div>
            {inv.file_url && (
              <a href={inv.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-1.5 text-xs hover:border-primary">
                <FileText className="h-3.5 w-3.5 text-primary" />{inv.file_name}<Download className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
        {(!invoices || invoices.length === 0) && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No invoices submitted yet.</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle>Submit invoice / receipt</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Milestone 1 payment" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 grid gap-1.5">
                <Label>Amount</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Currency</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
            </div>
            {(projects ?? []).length > 0 && (
              <div className="grid gap-1.5">
                <Label>Project (optional)</Label>
                <select className="rounded-md border bg-background px-3 py-2 text-sm" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                  <option value="">— none —</option>
                  {(projects ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Note</Label>
              <Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Attach file (PDF, image, receipt)</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
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
