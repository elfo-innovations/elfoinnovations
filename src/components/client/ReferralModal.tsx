import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const SESSION_KEY = "elfo_referral_modal_shown";

export function ReferralModal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: client } = useQuery({
    queryKey: ["me-client-referral", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("clients")
          .select("id, referral_code, referred_by_client_id")
          .eq("user_id", user!.id)
          .maybeSingle()
      ).data,
  });

  // Auto-open once per browser session, right after landing on the portal.
  useEffect(() => {
    if (!client || autoChecked) return;
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }
    setAutoChecked(true);
  }, [client, autoChecked]);

  const copyCode = async () => {
    if (!client?.referral_code) return;
    try {
      await navigator.clipboard.writeText(client.referral_code);
      setCopied(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  const applyCode = async () => {
    if (!code.trim()) return toast.error("Enter a referral code");
    setSubmitting(true);
    const { data, error } = await supabase.rpc("redeem_referral_code", { p_code: code.trim() });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    const result = data as { success: boolean; message: string };
    if (!result.success) return toast.error(result.message);
    toast.success(result.message);
    setCode("");
    qc.invalidateQueries({ queryKey: ["me-client-referral", user?.id] });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="glass-card mt-4 flex w-full items-center gap-3 rounded-2xl border border-primary/20 p-4 text-left transition-colors hover:border-primary/50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Refer & Earn</span>
          <span className="block text-xs text-muted-foreground">
            Share your code — you both get 10% off
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden border-primary/20 bg-background/80 p-0 backdrop-blur-2xl">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/5" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-col items-center px-6 pb-6 pt-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Gift className="h-6 w-6" />
              </span>
              <DialogTitle className="mt-4 font-display text-xl font-bold">
                Refer a friend, save together
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Get discounts for the friend you refer — you both get 10% off when they start a
                project.
              </DialogDescription>

              {client?.referral_code && (
                <div className="mt-6 w-full">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Your referral code
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-card/60 px-4 py-3">
                    <span className="font-mono text-lg font-bold tracking-widest text-primary">
                      {client.referral_code}
                    </span>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={copyCode}>
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 w-full border-t pt-6">
                {client?.referred_by_client_id ? (
                  <p className="text-sm font-medium text-emerald-500">
                    ✅ Referral code applied — your discount is linked to your account.
                  </p>
                ) : (
                  <>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left">
                      Have a friend's code?
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="font-mono"
                      />
                      <Button
                        onClick={applyCode}
                        disabled={submitting}
                        className="shrink-0 rounded-full electric-glow"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
