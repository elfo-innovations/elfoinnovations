import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput, defaultPhone, type PhoneValue } from "./PhoneInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { enqueueInquiry } from "@/lib/offline-queue";
import { useServerFn } from "@tanstack/react-start";
import { notifyAdminOfLead } from "@/lib/leads-notify.functions";

type BudgetReadiness = "yes_approved" | "maybe_depends" | "not_yet_exploring";

const budgetOptions: { value: BudgetReadiness; title: string; desc: string }[] = [
  { value: "yes_approved", title: "YES — I HAVE BUDGET APPROVED", desc: "Ready to move once we align on scope." },
  { value: "maybe_depends", title: "MAYBE — DEPENDS ON THE PLAN", desc: "I want to see the proposal first." },
  { value: "not_yet_exploring", title: "NOT YET — JUST EXPLORING", desc: "Gathering ideas for later." },
];

export function InquiryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifyAdmin = useServerFn(notifyAdminOfLead);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | { code: string }>(null);

  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<BudgetReadiness | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<PhoneValue>(defaultPhone());
  const [company, setCompany] = useState("");
  const [timeline, setTimeline] = useState("");
  const [estBudget, setEstBudget] = useState("");
  const [contactMethod, setContactMethod] = useState("email");

  const reset = () => {
    setStep(0); setDone(null); setDescription(""); setBudget(null);
    setFullName(""); setEmail(""); setPhone(defaultPhone()); setCompany("");
    setTimeline(""); setEstBudget(""); setContactMethod("email");
  };

  const close = () => { onClose(); setTimeout(reset, 300); };

  const canNext =
    (step === 0 && description.trim().length >= 20) ||
    (step === 1 && budget !== null) ||
    (step === 2 &&
      fullName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      phone.valid &&
      !!estBudget &&
      !!timeline);

  const submit = async () => {
    if (!canNext) {
      if (!estBudget || !timeline) {
        toast.error("Estimated budget and timeline are required");
      }
      return;
    }
    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.full.replace(/\s+/g, "");
    const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

    const payload = {
      full_name: fullName.trim(),
      email: normalizedEmail,
      phone: phone.full,
      country: phone.country.name,
      country_code: phone.country.dial,
      company: company.trim() || null,
      project_description: description.trim(),
      budget_readiness: budget!,
      estimated_budget: estBudget || null,
      timeline: timeline || null,
      preferred_contact: contactMethod,
    };

    // Offline path: queue in IndexedDB and confirm to the user.
    if (isOffline) {
      try {
        const q = await enqueueInquiry(payload);
        const offlineCode = `ELFO-${q.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
        setSubmitting(false);
        toast.success("You are offline. Your inquiry has been saved on this device and will be sent automatically when your connection returns.");
        setDone({ code: offlineCode });
        return;
      } catch (e: any) {
        setSubmitting(false);
        toast.error("Could not save inquiry offline. Please try again when online.");
        return;
      }
    }

    const [{ data: emailHit }, { data: phoneHit }] = await Promise.all([
      supabase.from("leads").select("id").ilike("email", normalizedEmail).limit(1).maybeSingle(),
      supabase.from("leads").select("id").eq("phone", normalizedPhone).limit(1).maybeSingle(),
    ]);
    if (emailHit) {
      setSubmitting(false);
      toast.error("A user with this email address has already been registered");
      return;
    }
    if (phoneHit) {
      setSubmitting(false);
      toast.error("A user with this phone number has already been registered");
      return;
    }

    const leadCode = `ELFO-${(typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2, 10)
    ).slice(0, 8).toUpperCase()}`;
    const { error } = await supabase.from("leads").insert({ lead_code: leadCode, ...payload });
    setSubmitting(false);
    if (!error) {
      // Fire-and-forget: don't block the success UI on email delivery.
      notifyAdmin({
        data: {
          lead_code: leadCode,
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          project_description: payload.project_description,
          budget_readiness: payload.budget_readiness,
          estimated_budget: payload.estimated_budget ?? null,
          timeline: payload.timeline ?? null,
        },
      }).catch(() => {});
    }
    if (error) {
      // Network hiccup — queue as fallback so the user isn't blocked.
      if (/fetch|network|failed to fetch/i.test(error.message || "")) {
        try {
          const q = await enqueueInquiry(payload);
          const offlineCode = `ELFO-${q.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
          toast.success("Network issue detected. Your inquiry has been saved and will retry automatically.");
          setDone({ code: offlineCode });
          return;
        } catch {}
      }
      const msg = /duplicate|unique|already/i.test(error.message)
        ? "A user with this email address has already been registered"
        : error.message || "Something went wrong. Please try again.";
      toast.error(msg);
      return;
    }
    setDone({ code: leadCode });
  };


  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[92vh] max-w-3xl gap-0 overflow-y-auto p-0 sm:rounded-3xl">
        <div className="relative bg-hero-radial">


          {done ? (
            <div className="flex flex-col items-center px-8 py-16 text-center">
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <Check className="relative h-9 w-9 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Thank you for reaching out to ELFO INNOVATIONS.</h2>
              <p className="mt-4 max-w-lg text-muted-foreground">
                We've received your project details and will contact you within 24 hours to align on scope.
              </p>
              <div className="mt-6 rounded-full border bg-card px-5 py-2 text-sm">
                Reference: <span className="font-mono font-semibold text-primary">{done.code}</span>
              </div>
              <Button onClick={close} className="mt-8 rounded-full px-8">Close</Button>
            </div>
          ) : (
            <>
              {/* progress */}
              <div className="flex items-center gap-2 border-b px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">Step {step + 1} of 3</span>
                <div className="ml-auto flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-1.5 w-6 rounded-full transition-all sm:w-8 ${i <= step ? "bg-primary" : "bg-muted"}`} />
                  ))}
                </div>
              </div>

              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      <h2 className="font-display text-3xl font-bold tracking-tight">What's the purpose of your website or software?</h2>
                      <p className="mt-2 text-muted-foreground">Tell us what you're trying to build and who it serves.</p>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your idea, target users, and the outcomes you want..."
                        className="mt-5 min-h-[180px] resize-none rounded-2xl text-base"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {description.trim().length < 20 ? `At least ${20 - description.trim().length} more characters` : "Looks good."}
                      </p>
                    </motion.div>
                  )}

                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      <h2 className="font-display text-3xl font-bold tracking-tight">Are you ready to invest in a serious build?</h2>
                      <p className="mt-2 text-muted-foreground">We work with committed teams. This helps us prioritize.</p>
                      <div className="mt-5 grid gap-3">
                        {budgetOptions.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setBudget(o.value)}
                            className={`group relative rounded-2xl border p-5 text-left transition-all hover:border-primary/60 hover:bg-primary/5 ${
                              budget === o.value ? "border-primary bg-primary/10 electric-glow" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${budget === o.value ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                                {budget === o.value && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <div>
                                <div className="text-sm font-bold tracking-wide">{o.title}</div>
                                <div className="mt-1 text-sm text-muted-foreground">{o.desc}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      <h2 className="font-display text-3xl font-bold tracking-tight">Where can we reach you?</h2>
                      <p className="mt-2 text-muted-foreground">We'll get back within 24 hours.</p>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <Label>Full Name *</Label>
                          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5 rounded-xl" placeholder="Jane Doe" />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" placeholder="jane@company.com" />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Phone Number *</Label>
                          <div className="mt-1.5"><PhoneInput value={phone} onChange={setPhone} /></div>
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1.5 rounded-xl" placeholder="Acme Inc." />
                        </div>
                        <div>
                          <Label>Estimated Budget *</Label>
                          <Select value={estBudget} onValueChange={setEstBudget}>
                            <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="500">$500 — Starter</SelectItem>
                              <SelectItem value="1000">$1,000 — Professional</SelectItem>
                              <SelectItem value="1500">$1,500 — Business</SelectItem>
                              <SelectItem value="custom">Custom — Premium / Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Timeline *</Label>
                          <Select value={timeline} onValueChange={setTimeline}>
                            <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asap">ASAP</SelectItem>
                              <SelectItem value="1_month">Within 1 month</SelectItem>
                              <SelectItem value="1_3_months">1–3 months</SelectItem>
                              <SelectItem value="3_6_months">3–6 months</SelectItem>
                              <SelectItem value="flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Preferred Contact Method</Label>
                          <Select value={contactMethod} onValueChange={setContactMethod}>
                            <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone Call</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background/95 px-5 py-4 backdrop-blur sm:px-8 sm:py-5">
                <Button variant="ghost" onClick={step === 0 ? close : () => setStep(step - 1)} className="rounded-full">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  {step === 0 ? "Cancel" : "Back"}
                </Button>
                {step < 2 ? (
                  <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="rounded-full px-6">
                    Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button disabled={!canNext || submitting} onClick={submit} className="rounded-full px-6 electric-glow">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : <>Submit Inquiry <ArrowRight className="ml-1.5 h-4 w-4" /></>}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
