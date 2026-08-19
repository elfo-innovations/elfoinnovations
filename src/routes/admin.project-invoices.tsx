import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Printer, X } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ElfoLogo } from "@/components/brand/Logo";

export const Route = createFileRoute("/admin/project-invoices")({
  component: AdminProjectInvoices,
});

type InvoiceRow = {
  id: string;
  invoice_number: string;
  currency: string;
  items: { description: string; qty: number; unit_price: number; amount: number }[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  created_at: string;
  clients: { full_name: string; email: string; company: string | null; phone: string | null } | null;
  projects: { name: string; project_code: string } | null;
};

function AdminProjectInvoices() {
  const [active, setActive] = useState<InvoiceRow | null>(null);

  const { data } = useQuery({
    queryKey: ["project_invoices"],
    queryFn: async () =>
      (
        await supabase
          .from("project_invoices")
          .select("*, clients(full_name, email, company, phone), projects(name, project_code)")
          .order("created_at", { ascending: false })
      ).data as InvoiceRow[] | null,
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

function InvoicePrintView({ invoice, onClose }: { invoice: InvoiceRow; onClose: () => void }) {
  const dueDate = new Date(invoice.created_at);
  dueDate.setDate(dueDate.getDate() + 14);

  return (
    <div>
      <div className="flex items-center justify-between border-b p-4 print:hidden">
        <div className="text-sm font-semibold">{invoice.invoice_number}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print / Save as PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <div id="invoice-sheet" className="bg-white p-8 text-black">
        <div className="flex flex-wrap items-start justify-between gap-6 rounded-2xl bg-[#0a1128] p-6 text-white">
          <ElfoLogo className="[&_img]:brightness-0 [&_img]:invert" />
          <div className="text-right">
            <div className="text-3xl font-extrabold tracking-tight">INVOICE</div>
            <div className="mt-1 text-sm text-blue-300">#{invoice.invoice_number}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600">Billed To</div>
            <div className="mt-1 font-semibold">{invoice.clients?.full_name}</div>
            {invoice.clients?.company && <div className="text-sm text-gray-600">{invoice.clients.company}</div>}
            <div className="text-sm text-gray-600">{invoice.clients?.email}</div>
            {invoice.clients?.phone && <div className="text-sm text-gray-600">{invoice.clients.phone}</div>}
          </div>
          <div className="sm:text-right">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600">From</div>
            <div className="mt-1 font-semibold">Elfo Innovations</div>
            <div className="text-sm text-gray-600">hello@elfoinnovations.com</div>
            <div className="text-sm text-gray-600">www.elfoinnovations.com</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border p-4 text-sm sm:grid-cols-4">
          <div>
            <div className="text-[11px] font-bold uppercase text-gray-500">Invoice Date</div>
            <div>{new Date(invoice.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-gray-500">Due Date</div>
            <div>{dueDate.toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-gray-500">Project</div>
            <div>{invoice.projects?.project_code}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-gray-500">Currency</div>
            <div>{invoice.currency}</div>
          </div>
        </div>

        <table className="mt-6 w-full overflow-hidden rounded-xl text-sm">
          <thead>
            <tr className="bg-[#0a1128] text-left text-white">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="px-3 py-2">{String(i + 1).padStart(2, "0")}</td>
                <td className="px-3 py-2 font-medium">{item.description}</td>
                <td className="px-3 py-2 text-right">{item.qty}</td>
                <td className="px-3 py-2 text-right">{Number(item.unit_price).toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-semibold">{Number(item.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{Number(invoice.subtotal).toLocaleString()}</span></div>
            {invoice.discount > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>- {Number(invoice.discount).toLocaleString()}</span></div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Tax ({invoice.tax_rate}%)</span><span>{Number(invoice.tax_amount).toLocaleString()}</span></div>
            )}
            <div className="mt-2 flex justify-between rounded-lg bg-[#0a1128] px-3 py-2 font-bold text-white">
              <span>Total Due</span><span>{invoice.currency} {Number(invoice.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          Thank you for choosing Elfo Innovations. If you have any questions, feel free to contact us.
        </div>
      </div>
    </div>
  );
}