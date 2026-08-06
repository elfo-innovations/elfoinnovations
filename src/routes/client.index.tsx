import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell, StatCard } from "@/components/dashboard/DashboardShell";
import { Briefcase, CheckCircle2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const COMPLETED = new Set(["admin_approved", "sent_to_client", "client_approved"]);

export const Route = createFileRoute("/client/")({
  head: () => ({ meta: [{ title: "Client — ELFO INNOVATIONS" }] }),
  component: ClientOverview,
});

function ClientOverview() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["me-profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: stats } = useQuery({
    queryKey: ["client-overview", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: client } = await supabase.from("clients").select("id").eq("user_id", user!.id).maybeSingle();
      if (!client) return { active: 0, completedStages: 0, invoices: 0 };
      const [projects, invoices] = await Promise.all([
        supabase.from("projects").select("id, project_stages(status)").eq("client_id", client.id),
        supabase.from("client_invoices").select("id", { count: "exact", head: true }).eq("client_id", client.id),
      ]);
      const rows = projects.data ?? [];
      const completedStages = rows.reduce(
        (n: number, p: any) => n + ((p.project_stages ?? []).filter((s: any) => COMPLETED.has(s.status)).length),
        0,
      );
      return { active: rows.length, completedStages, invoices: invoices.count ?? 0 };
    },
  });

  const displayName = (profile?.full_name || user?.email?.split("@")[0] || "there").trim();

  return (
    <DashboardShell role="client">
      <h1 className="font-display text-3xl font-bold tracking-tight">Welcome, {displayName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track your projects and stay in touch with your team.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active projects" value={stats?.active ?? "…"} hint="Submitted requirements" icon={Briefcase} />
        <StatCard label="Completed stages" value={stats?.completedStages ?? "…"} hint="Approved milestones" icon={CheckCircle2} />
        <StatCard label="Invoices" value={stats?.invoices ?? "…"} hint="Submitted so far" icon={Receipt} />
      </div>
      <div className="glass-card mt-8 rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">You're in good hands</h2>
        <p className="mt-2 text-sm text-muted-foreground">Every project goes through Frontend → Backend → Database → Hosting. Admin reviews each stage before it reaches you.</p>
      </div>
    </DashboardShell>
  );
}
