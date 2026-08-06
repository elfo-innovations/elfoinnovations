import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Star, Check, X, Search, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin" }] }),
  component: AdminReviews,
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  };
  return <Badge variant="outline" className={map[status] || ""}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function AdminReviews() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [rejectFor, setRejectFor] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: reviews } = useQuery({
    queryKey: ["admin-reviews", statusFilter],
    queryFn: async () => {
      let query = supabase.from("client_reviews").select("*, projects(name)").order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      return (await query).data ?? [];
    },
  });

  const filtered = (reviews ?? []).filter((r: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [r.client_name, r.company, r.email, r.title, r.message].some((x) => (x || "").toLowerCase().includes(s));
  });

  const setStatus = async (id: string, status: "approved" | "rejected", rejection_reason?: string) => {
    setBusyId(id);
    const { error } = await supabase.from("client_reviews").update({
      status, rejection_reason: rejection_reason ?? null,
      reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Review ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    qc.invalidateQueries({ queryKey: ["public-reviews"] });
    setRejectFor(null); setReason("");
  };

  const counts = {
    pending: (reviews ?? []).filter((r: any) => r.status === "pending").length,
    approved: (reviews ?? []).filter((r: any) => r.status === "approved").length,
    rejected: (reviews ?? []).filter((r: any) => r.status === "rejected").length,
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Reviews</h1>
            <p className="mt-1 text-sm text-muted-foreground">Moderate client reviews before they appear on the public site.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending {counts.pending}</Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Approved {counts.approved}</Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Rejected {counts.rejected}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, email, text…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-sm text-muted-foreground">No reviews found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r: any) => (
              <div key={r.id} className="glass-card rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                      </div>
                      <StatusBadge status={r.status} />
                      {r.allow_public ? (
                        <Badge variant="outline" className="text-[10px]">Public consent</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-muted">No public consent</Badge>
                      )}
                      {r.projects?.name && <Badge variant="outline" className="text-[10px]">{r.projects.name}</Badge>}
                    </div>
                    <div className="mt-2 font-semibold">{r.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.message}</p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{r.client_name}</span>
                      {r.company && <> · {r.company}</>} · {r.email} · {format(new Date(r.created_at), "PPp")}
                    </div>
                    {r.status === "rejected" && r.rejection_reason && (
                      <p className="mt-2 text-xs text-red-600">Rejection reason: {r.rejection_reason}</p>
                    )}
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setStatus(r.id, "approved")} disabled={busyId === r.id} className="rounded-full">
                        {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-4 w-4" />Approve</>}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setRejectFor(r); setReason(""); }} className="rounded-full">
                        <X className="mr-1 h-4 w-4" />Reject
                      </Button>
                    </div>
                  )}
                  {r.status !== "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "pending" as any)} disabled className="rounded-full opacity-0 pointer-events-none">.</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject review</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Optional reason (visible to the client).</p>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="e.g. Please expand on specifics or remove sensitive info." />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => rejectFor && setStatus(rejectFor.id, "rejected", reason.trim() || undefined)}>
                Reject review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
