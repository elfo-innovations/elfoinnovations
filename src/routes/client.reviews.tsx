import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Star, Send, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/client/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Client" }] }),
  component: ClientReviews,
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  };
  return <Badge variant="outline" className={map[status] || ""}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function StarPicker({ value, onChange, readOnly = false }: { value: number; onChange?: (n: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={`transition ${readOnly ? "cursor-default" : "hover:scale-110"}`}
        >
          <Star className={`h-6 w-6 ${n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

function ClientReviews() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: client } = useQuery({
    queryKey: ["me-client", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("clients").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: projects } = useQuery({
    queryKey: ["me-client-projects", client?.id],
    enabled: !!client,
    queryFn: async () => (await supabase.from("projects").select("id,name").eq("client_id", client!.id)).data ?? [],
  });

  const { data: reviews, refetch } = useQuery({
    queryKey: ["me-reviews", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("client_reviews").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [allowPublic, setAllowPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || !client) return toast.error("Client profile not loaded");
    if (!title.trim() || !message.trim()) return toast.error("Title and message are required");
    setSubmitting(true);
    const { error } = await supabase.from("client_reviews").insert({
      user_id: user.id,
      client_id: client.id,
      project_id: projectId === "none" ? null : projectId,
      client_name: client.full_name,
      company: client.company,
      email: client.email,
      title: title.trim(),
      message: message.trim(),
      rating,
      allow_public: allowPublic,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.error("You already have an active review for this project.");
      else toast.error(error.message);
      return;
    }
    toast.success("Review submitted — pending admin approval");
    setTitle(""); setMessage(""); setRating(5); setProjectId("none"); setAllowPublic(true);
    qc.invalidateQueries({ queryKey: ["me-reviews", user.id] });
    refetch();
  };

  return (
    <DashboardShell role="client">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">Share your experience working with Elfo Innovations.</p>
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Submit a review</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="mt-2"><StarPicker value={rating} onChange={setRating} /></div>
            </div>
            <div>
              <Label htmlFor="rv-title">Title</Label>
              <Input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Summarise your experience" />
            </div>
            <div>
              <Label htmlFor="rv-message">Your review</Label>
              <Textarea id="rv-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={1200} placeholder="Tell us about the process, quality, and outcome…" />
            </div>
            {(projects?.length ?? 0) > 0 && (
              <div>
                <Label>Related project (optional)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {projects!.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <label className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
              <Checkbox checked={allowPublic} onCheckedChange={(v) => setAllowPublic(!!v)} className="mt-0.5" />
              <span>I agree that Elfo Innovations may display this review publicly on its website.</span>
            </label>
            <div className="rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">
              Submitting as <span className="font-semibold text-foreground">{client?.full_name}</span>
              {client?.company && <> · {client.company}</>} · {client?.email}
            </div>
            <Button onClick={submit} disabled={submitting} className="rounded-full">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit review
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Your reviews</h2>
          {(reviews?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">You haven't submitted any reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews!.map((r: any) => (
                <div key={r.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StarPicker value={r.rating} readOnly />
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-2 font-semibold">{r.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{r.message}</p>
                      {r.status === "rejected" && r.rejection_reason && (
                        <p className="mt-2 text-xs text-red-600">Reason: {r.rejection_reason}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "PP")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
