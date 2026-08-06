import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, FolderKanban, Code2, DollarSign } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — ELFO INNOVATIONS" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["me-profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle()).data,
  });
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [leads, clients, developers, projects] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("developers").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
      ]);
      return {
        leads: leads.count ?? 0, clients: clients.count ?? 0,
        developers: developers.count ?? 0, projects: projects.count ?? 0,
      };
    },
  });
  const name = (profile?.full_name || user?.email?.split("@")[0] || "Admin").trim();

  return (
    <DashboardShell role="admin">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back, {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything happening across ELFO INNOVATIONS.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads" value={stats?.leads ?? "…"} icon={FileText} hint="Inquiries received" />
        <StatCard label="Clients" value={stats?.clients ?? "…"} icon={Users} hint="Active accounts" />
        <StatCard label="Developers" value={stats?.developers ?? "…"} icon={Code2} hint="On the team" />
        <StatCard label="Projects" value={stats?.projects ?? "…"} icon={FolderKanban} hint="In pipeline" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">4-Stage Delivery Pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every project moves through Frontend → Backend → Database → Hosting.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {["Frontend", "Backend", "Database", "Hosting"].map((s, i) => (
              <div key={s} className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Stage {i + 1}</div>
                <div className="mt-1 font-semibold">{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold">Revenue</h2>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><DollarSign className="h-5 w-5" /></div>
            <div>
              <div className="font-display text-2xl font-bold">—</div>
              <div className="text-xs text-muted-foreground">Payment tracking active</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
