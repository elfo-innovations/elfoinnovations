import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { Check, Copy, Download, Eye, EyeOff, KeyRound, Loader2, Search, UserPlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { createClientWithLogin } from "@/lib/clients.functions";
import { generateBrandedPassword } from "@/lib/branded-password";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Leads — Admin" }] }),
  component: AdminLeads,
});

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "meeting_scheduled", label: "Meeting scheduled" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won (closed)" },
  { value: "lost", label: "Lost (closed)" },
  { value: "converted", label: "Converted to client" },
];

const CLOSED = new Set(["won", "lost", "converted"]);
function optionsFor(current: string) {
  if (CLOSED.has(current)) return STATUSES.filter((s) => s.value === current);
  const idx = STATUSES.findIndex((s) => s.value === current);
  return STATUSES.slice(idx === -1 ? 0 : idx);
}

function genPassword() {
  return generateBrandedPassword();
}

function AdminLeads() {
  const qc = useQueryClient();
  const createClient = useServerFn(createClientWithLogin);
  const [convertLead, setConvertLead] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<null | { email: string; password: string }>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => (await supabase.from("leads").select("*").order("created_at", { ascending: false })).data,
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
  };

  const openConvert = (lead: any) => {
    setConvertLead(lead);
    setPassword(genPassword());
    setShowPw(false);
  };

  const submitConvert = async () => {
    if (!convertLead) return;
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      await createClient({
        data: {
          full_name: convertLead.full_name,
          email: convertLead.email,
          password,
          phone: convertLead.phone,
          company: convertLead.company,
          country: convertLead.country,
          source_lead_id: convertLead.id,
        },
      });
      toast.success("Client login created");
      setCredentials({ email: convertLead.email, password });
      setConvertLead(null);
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create login");
    } finally {
      setBusy(false);
    }
  };

  const copyCreds = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(`Portal: ${window.location.origin}/auth\nEmail: ${credentials.email}\nPassword: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = (data ?? []).filter((l: any) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [l.lead_code, l.full_name, l.email, l.phone, l.company, l.country].some((v) => v?.toLowerCase().includes(q));
  });

  const exportCsv = () => {
    if (!filtered.length) return toast.error("No leads to export");
    const cols = ["lead_code","full_name","email","phone","company","country","budget_readiness","est_budget","timeline","status","message","created_at"];
    const esc = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const csv = [cols.join(","), ...filtered.map((r: any) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elfo-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} lead${filtered.length === 1 ? "" : "s"}`);
  };

  return (
    <DashboardShell role="admin">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update status inline or convert a lead into a client portal login.</p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by ref, name, email, phone, company…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} className="sm:w-auto"><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>




      <div className="mt-4 grid gap-3 lg:hidden">
        {(data ?? []).filter((l: any) => {
          if (statusFilter !== "all" && l.status !== statusFilter) return false;
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return [l.lead_code, l.full_name, l.email, l.phone, l.company, l.country].some((v) => v?.toLowerCase().includes(q));
        }).map((l: any) => (
          <div key={l.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-primary">{l.lead_code}</div>
                <div className="mt-0.5 truncate font-semibold">{l.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">{l.email}</div>
                <div className="text-xs text-muted-foreground">{l.phone}</div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">{l.budget_readiness}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{optionsFor(l.status).map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              {!l.converted_client_id && (
                <Button size="sm" variant="outline" className="h-8" onClick={() => openConvert(l)}><UserPlus className="h-3.5 w-3.5" /></Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card mt-6 hidden overflow-hidden rounded-2xl lg:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Ref</th><th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th><th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3">Received</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).filter((l: any) => {
              if (statusFilter !== "all" && l.status !== statusFilter) return false;
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return [l.lead_code, l.full_name, l.email, l.phone, l.company, l.country].some((v) => v?.toLowerCase().includes(q));
            }).map((l: any) => (
              <tr key={l.id} className="border-t hover:bg-accent/30">
                <td className="px-4 py-3 font-mono text-xs text-primary">{l.lead_code}</td>
                <td className="px-4 py-3 font-medium">{l.full_name}<div className="text-xs text-muted-foreground">{l.company ?? "—"}</div></td>
                <td className="px-4 py-3">{l.email}<div className="text-xs text-muted-foreground">{l.phone}</div></td>
                <td className="px-4 py-3"><Badge variant="outline">{l.budget_readiness}</Badge></td>
                <td className="px-4 py-3">
                  <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                    <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{optionsFor(l.status).map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d, yyyy")}</td>
                <td className="px-4 py-3 text-right">
                  {l.converted_client_id ? (
                    <span className="text-[11px] text-emerald-600">Client created</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => openConvert(l)}>
                      <UserPlus className="mr-1 h-3.5 w-3.5" /> Create login
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No leads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!convertLead} onOpenChange={(v) => !v && setConvertLead(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle>Create client login</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">Portal access for <b>{convertLead?.full_name}</b> ({convertLead?.email}). The lead will be marked as converted.</p>
            <div className="grid gap-1.5">
              <Label>Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-9" />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={() => setPassword(genPassword())}>Generate</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConvertLead(null)}>Cancel</Button>
            <Button onClick={submitConvert} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create login"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentials} onOpenChange={(v) => !v && setCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Client credentials</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Send these to the client. This password won't be shown again.</p>
            <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm">
              <div><span className="text-muted-foreground">Portal:</span> {typeof window !== "undefined" ? window.location.origin : ""}/auth</div>
              <div><span className="text-muted-foreground">Email:</span> {credentials?.email}</div>
              <div><span className="text-muted-foreground">Password:</span> {credentials?.password}</div>
            </div>
            <Button onClick={copyCreds} className="w-full">{copied ? <><Check className="mr-2 h-4 w-4" />Copied</> : <><Copy className="mr-2 h-4 w-4" />Copy all</>}</Button>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setCredentials(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
