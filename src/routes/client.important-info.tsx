import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Database, FolderKey, Receipt, Briefcase } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/client/important-info")({
  head: () => ({ meta: [{ title: "Important Info — Client" }] }),
  component: ImportantInfo,
});

function Section({ icon: Icon, title, subtitle, children }: any) {
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ImportantInfo() {
  const { user } = useAuth();

  const { data: client } = useQuery({
    queryKey: ["me-client-info", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("clients").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: projects } = useQuery({
    queryKey: ["client-info-projects", client?.id],
    enabled: !!client,
    queryFn: async () => (await supabase.from("projects").select("*").eq("client_id", client!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: invoices } = useQuery({
    queryKey: ["client-info-invoices", client?.id],
    enabled: !!client,
    queryFn: async () => (await supabase.from("client_invoices").select("*").eq("client_id", client!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: files } = useQuery({
    queryKey: ["client-info-files", client?.id],
    enabled: !!client && !!projects?.length,
    queryFn: async () => {
      const ids = projects!.map((p: any) => p.id);
      if (!ids.length) return [];
      return (await supabase.from("project_files").select("*, projects(name, project_code)").in("project_id", ids).order("created_at", { ascending: false })).data ?? [];
    },
  });

  const activeProject = projects?.[0];
  const contracts = (files ?? []).filter((f: any) => /contract|agreement|nda|proposal|doc/i.test(f.category ?? "") || /\.(pdf|docx?)$/i.test(f.file_name ?? ""));

  return (
    <DashboardShell role="client">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Important info</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything you need in one place — bills, database access, and key documents.</p>

      <div className="mt-6 grid gap-4">
        <Section icon={Briefcase} title="Project" subtitle={activeProject ? `${(activeProject as any).project_code} · ${activeProject.name}` : "Awaiting kickoff"}>
          {activeProject ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="capitalize">{activeProject.status?.replace(/_/g, " ")}</Badge>
              {(activeProject as any).start_date && <span className="text-xs text-muted-foreground">Started {new Date((activeProject as any).start_date).toLocaleDateString()}</span>}
              {(activeProject as any).summary && <p className="mt-2 w-full text-sm text-muted-foreground">{(activeProject as any).summary}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Your account manager will populate this shortly.</p>
          )}
        </Section>

        <Section icon={Database} title="Database & credentials" subtitle="Shared securely by your admin">
          {(activeProject as any)?.internal_notes ? (
            <pre className="whitespace-pre-wrap rounded-xl border bg-background/60 p-3 font-mono text-xs">{(activeProject as any).internal_notes}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">Access details will appear here once your environment is provisioned.</p>
          )}
        </Section>

        <Section icon={Receipt} title="Payment bills" subtitle="Full history of invoices you've submitted">
          {(invoices ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Invoice</th>
                    <th className="py-2 pr-4 font-medium">Amount</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Issued</th>
                    <th className="py-2 font-medium">File</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices!.map((inv: any) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{inv.title}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{inv.amount ? `${inv.currency} ${Number(inv.amount).toFixed(2)}` : "—"}</td>
                      <td className="py-2 pr-4"><Badge variant="outline" className="capitalize">{inv.status}</Badge></td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="py-2">
                        {inv.file_url ? (
                          <a href={inv.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <Download className="h-3 w-3" />{inv.file_name ?? "download"}
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section icon={FolderKey} title="Contracts & documents" subtitle="Signed agreements and key documents from your admin">
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents shared yet.</p>
          ) : (
            <ul className="grid gap-2">
              {contracts.map((f: any) => (
                <li key={f.id}>
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 text-sm hover:border-primary">
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{f.file_name}</div>
                      <div className="text-xs text-muted-foreground">{f.projects?.project_code} · {new Date(f.created_at).toLocaleDateString()}</div>
                    </div>
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </DashboardShell>
  );
}
