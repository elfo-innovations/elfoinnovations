import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, UploadCloud, FileText, X, CheckCircle2, Rocket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { submitDeveloperApplication } from "@/lib/developer-applications.functions";
import {
  PRIMARY_ROLES,
  EXPERIENCE_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  RESUME_MAX_BYTES,
  validateApplication,
} from "@/lib/application-validation";
import { toast } from "sonner";

type Form = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  primary_role: string;
  years_experience: string;
  current_status: string;
  bio: string;
  motivation: string;
};

const EMPTY: Form = {
  full_name: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  github_url: "",
  linkedin_url: "",
  portfolio_url: "",
  primary_role: "",
  years_experience: "",
  current_status: "",
  bio: "",
  motivation: "",
};

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function DeveloperApplicationModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const submit = useServerFn(submitDeveloperApplication);
  const [form, setForm] = useState<Form>(EMPTY);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const addSkill = () => {
    const v = skillInput.trim().replace(/,$/, "");
    if (!v) return;
    if (!skills.includes(v)) setSkills((s) => [...s, v]);
    setSkillInput("");
    setErrors((e) => ({ ...e, skills: "" }));
  };

  const pickFile = (f: File | null) => {
    if (!f) return setFile(null);
    if (!/\.pdf$/i.test(f.name) || f.type !== "application/pdf") {
      setErrors((e) => ({ ...e, resume: "Resume must be a PDF file" }));
      return;
    }
    if (f.size > RESUME_MAX_BYTES) {
      setErrors((e) => ({ ...e, resume: "Resume must be under 5MB" }));
      return;
    }
    setErrors((e) => ({ ...e, resume: "" }));
    setFile(f);
  };

  const reset = () => {
    setForm(EMPTY);
    setSkills([]);
    setSkillInput("");
    setAgreed(false);
    setFile(null);
    setErrors({});
    setDone(false);
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 250);
  };

  const onSubmit = async () => {
    const payload = { ...form, skills, agreed, resume_name: file?.name ?? null };
    const errs = validateApplication(payload as any);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setBusy(true);
    try {
      let resume_path: string | null = null;
      if (file) {
        const path = `applications/${crypto.randomUUID()}.pdf`;
        const { error: upErr } = await supabase.storage
          .from("developer-resumes")
          .upload(path, file, { contentType: "application/pdf", upsert: false });
        if (upErr) throw new Error(`Resume upload failed: ${upErr.message}`);
        resume_path = path;
      }
      const res: any = await submit({ data: { ...payload, resume_path } as any });
      setDone(true);
      if (!res?.emailSent) {
        // Application is stored; email delivery just isn't configured yet.
        console.warn("Confirmation email not sent:", res?.emailError);
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not submit your application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-3xl border-primary/20 bg-card/95 p-0 backdrop-blur-xl sm:w-full">


        {done ? (
          <div className="px-6 py-14 text-center sm:px-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold">Application submitted</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              Thank you for applying to ELFO Innovations. Our engineering team reviews every application — we'll email you
              with a decision at <span className="font-semibold text-foreground">{form.email}</span>.
            </p>
            <Button className="mt-7 rounded-full electric-glow" onClick={() => close(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="px-5 py-8 sm:px-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                <Rocket className="h-3.5 w-3.5" /> Join the team
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Become an <span className="electric-text">ELFO</span> Developer
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us about yourself. Every application is reviewed by our engineering team.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required error={errors.full_name}>
                  <Input className="rounded-xl" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Doe" />
                </Field>
                <Field label="Email address" required error={errors.email}>
                  <Input className="rounded-xl" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
                </Field>
                <Field label="Phone number" required error={errors.phone}>
                  <Input className="rounded-xl" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 1234" />
                </Field>
                <Field label="Country" required error={errors.country}>
                  <Input className="rounded-xl" value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Pakistan" />
                </Field>
                <Field label="City" required error={errors.city}>
                  <Input className="rounded-xl" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Karachi" />
                </Field>
                <Field label="GitHub profile" required error={errors.github_url}>
                  <Input className="rounded-xl" value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="github.com/username" />
                </Field>
                <Field label="LinkedIn (optional)" error={errors.linkedin_url}>
                  <Input className="rounded-xl" value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="linkedin.com/in/username" />
                </Field>
                <Field label="Portfolio (optional)" error={errors.portfolio_url}>
                  <Input className="rounded-xl" value={form.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} placeholder="yourdomain.com" />
                </Field>
                <Field label="Primary role" required error={errors.primary_role}>
                  <Select value={form.primary_role} onValueChange={(v) => set("primary_role", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>{PRIMARY_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Years of experience" required error={errors.years_experience}>
                  <Select value={form.years_experience} onValueChange={(v) => set("years_experience", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select experience" /></SelectTrigger>
                    <SelectContent>{EXPERIENCE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Current status" required error={errors.current_status}>
                  <Select value={form.current_status} onValueChange={(v) => set("current_status", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>{CURRENT_STATUS_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Skills / technologies" required error={errors.skills}>
                <div className="flex gap-2">
                  <Input
                    className="rounded-xl"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); }
                    }}
                    placeholder="React, Node.js, PostgreSQL…"
                  />
                  <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {s}
                        <button onClick={() => setSkills((v) => v.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="Short bio" required error={errors.bio}>
                <Textarea className="min-h-[90px] rounded-xl" value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell us about your background and what you build best." />
              </Field>

              <Field label="Why do you want to join ELFO Innovations?" required error={errors.motivation}>
                <Textarea className="min-h-[90px] rounded-xl" value={form.motivation} onChange={(e) => set("motivation", e.target.value)} placeholder="What excites you about working with our team?" />
              </Field>

              <Field label="Resume (PDF, max 5MB)" error={errors.resume}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-4 transition hover:border-primary/60">
                  <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
                  {file ? <FileText className="h-5 w-5 shrink-0 text-primary" /> : <UploadCloud className="h-5 w-5 shrink-0 text-primary" />}
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {file ? file.name : "Click to upload your resume (optional)"}
                  </span>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setFile(null); }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </label>
              </Field>

              <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                <Checkbox id="dev-agree" checked={agreed} onCheckedChange={(v) => { setAgreed(!!v); setErrors((e) => ({ ...e, agreed: "" })); }} className="mt-0.5" />
                <label htmlFor="dev-agree" className="text-xs leading-relaxed text-muted-foreground">
                  I confirm the information provided is accurate and I agree to ELFO Innovations' confidentiality and
                  professional conduct expectations while my application is reviewed.
                  {errors.agreed && <span className="mt-1 block font-medium text-destructive">{errors.agreed}</span>}
                </label>
              </div>

              <Button onClick={onSubmit} disabled={busy} className="w-full rounded-full electric-glow">
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Submit application"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function BecomeDeveloperButton({ className, variant = "outline" }: { className?: string; variant?: "outline" | "default" | "ghost" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} className={className ?? "rounded-full"} onClick={() => setOpen(true)}>
        <Rocket className="mr-2 h-4 w-4" /> Become a Developer
      </Button>
      <DeveloperApplicationModal open={open} onOpenChange={setOpen} />
    </>
  );
}
