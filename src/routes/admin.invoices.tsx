import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Download } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["submitted", "reviewed", "approved", "rejected", "paid"];

export const Route = createFileRoute("/admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Admin" }] }),
  component: AdminInvoices,
});

function AdminInvoices() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => (await supabase.from("client_invoices").select("*, clients(full_name, email), projects(name, project_code)").order("created_at", { ascending: false })).data ?? [],
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("client_invoices").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-invoices"] });
  };

  return (
    <DashboardShell role="admin">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Client invoices</h1>
      <p className="mt-1 text-sm text-muted-foreground">Invoices and payment receipts submitted by clients.</p>

      <div className="mt-6 grid gap-3">
        {(data ?? []).map((inv: any) => (
          <div key={inv.id} className="glass-card rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{inv.title}</div>
                <div className="text-xs text-muted-foreground">From {inv.clients?.full_name} · {inv.clients?.email}</div>
                {inv.projects && <div className="text-xs text-primary">{inv.projects.project_code} · {inv.projects.name}</div>}
                {inv.amount && <div className="mt-1 font-mono text-sm">{inv.currency} {Number(inv.amount).toFixed(2)}</div>}
                {inv.note && <div className="mt-2 text-sm text-muted-foreground">{inv.note}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{inv.status}</Badge>
                <Select value={inv.status} onValueChange={(v) => updateStatus(inv.id, v)}>
                  <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {inv.file_url && (
              <a href={inv.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-1.5 text-xs hover:border-primary">
                <FileText className="h-3.5 w-3.5 text-primary" />{inv.file_name}<Download className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No invoices submitted yet.</div>
        )}
      </div>
    </DashboardShell>
  );
}
