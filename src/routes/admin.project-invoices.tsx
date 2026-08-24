import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InvoicePrintView, type ProjectInvoiceRow } from "@/components/invoices/InvoicePrintView";

export const Route = createFileRoute("/admin/project-invoices")({
  component: AdminProjectInvoices,
});

function AdminProjectInvoices() {
  const [active, setActive] = useState<ProjectInvoiceRow | null>(null);

  const { data } = useQuery({
    queryKey: ["project_invoices"],
    queryFn: async () =>
      (
        await supabase
          .from("project_invoices")
          .select("*, clients(full_name, email, company, phone), projects(name, project_code)")
          .order("created_at", { ascending: false })
      ).data as ProjectInvoiceRow[] | null,
  });

  const invoices = data ?? [];

  return (
    <DashboardShell role="admin">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Project invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Automatically generated whenever a client submits a project with services selected.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {invoices.length === 0 && (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No invoices yet — one will appear here as soon as a client submits a project with services selected.
          </div>
        )}
        {invoices.map((inv) => (
          <button
            key={inv.id}
            onClick={() => setActive(inv)}
            className="glass-card flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-left transition hover:border-primary"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{inv.invoice_number}</div>
                <div className="text-xs text-muted-foreground">
                  {inv.clients?.full_name} · {inv.clients?.email}
                </div>
                <div className="text-xs text-muted-foreground">{inv.projects?.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-display text-lg font-bold">
                  {inv.currency} {Number(inv.total).toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(inv.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge variant={inv.status === "paid" ? "default" : "secondary"} className="capitalize">
                {inv.status}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
          {active && <InvoicePrintView invoice={active} onClose={() => setActive(null)} />}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}