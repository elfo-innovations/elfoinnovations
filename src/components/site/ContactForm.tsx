import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/inquiry/PhoneInput";
import { defaultPhone, type PhoneValue } from "@/lib/phone";
import { Turnstile, type TurnstileHandle } from "@/components/Turnstile";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile-site-key";
import { submitContactMessage } from "@/lib/contact.functions";
import { cn } from "@/lib/utils";

type Touched = {
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  subject?: boolean;
  message?: boolean;
};

export function ContactForm() {
  const submitFn = useServerFn(submitContactMessage);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | { code: string }>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<PhoneValue>(defaultPhone());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState<Touched>({});
  const touch = (f: keyof Touched) => setTouched((t) => ({ ...t, [f]: true }));

  const isNameValid = name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  // Phone is optional, but if the visitor starts typing one it must be valid.
  const isPhoneValid = phone.local.length === 0 || phone.valid;
  const isSubjectValid = subject.trim().length >= 3;
  const isMessageValid = message.trim().length >= 10;

  const nameError = touched.name && !isNameValid ? "Please enter your name" : null;
  const emailError =
    touched.email && !isEmailValid
      ? email.trim().length === 0
        ? "Email is required"
        : "Enter a valid email address"
      : null;
  const phoneError = touched.phone && !isPhoneValid ? "Enter a valid phone number" : null;
  const subjectError = touched.subject && !isSubjectValid ? "Please add a subject" : null;
  const messageError =
    touched.message && !isMessageValid ? "Message must be at least 10 characters" : null;

  const reset = () => {
    setDone(null);
    setName("");
    setEmail("");
    setPhone(defaultPhone());
    setSubject("");
    setMessage("");
    setTouched({});
    setTurnstileToken(null);
  };

  const submit = async () => {
    if (!(isNameValid && isEmailValid && isPhoneValid && isSubjectValid && isMessageValid)) {
      setTouched({ name: true, email: true, phone: true, subject: true, message: true });
      toast.error("Please fix the highlighted fields before sending");
      return;
    }
    if (!turnstileToken) {
      toast.error("Please complete the verification challenge before sending");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      toast.error("You're offline. Please connect to the internet and try again.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitFn({
        data: {
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.local ? phone.full : null,
          subject: subject.trim(),
          message: message.trim(),
          turnstileToken,
        },
      });
      setDone({ code: res.messageCode });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      if (/fetch|network|failed to fetch/i.test(msg)) {
        toast.error("Sending failed. Please check your internet connection and try again.");
      } else {
        toast.error(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Message sent</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for reaching out. We've emailed you a confirmation and will reply as soon as we
          can.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Reference: <span className="font-mono text-primary">{done.code}</span>
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={reset}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8">
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact-name">Full name *</Label>
            <Input
              id="contact-name"
              autoComplete="name"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => touch("name")}
              aria-invalid={!!nameError}
              className={cn("mt-1.5 rounded-xl", nameError && "border-destructive")}
            />
            {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
          </div>
          <div>
            <Label htmlFor="contact-email">Email *</Label>
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch("email")}
              aria-invalid={!!emailError}
              className={cn("mt-1.5 rounded-xl", emailError && "border-destructive")}
            />
            {emailError && <p className="mt-1 text-xs text-destructive">{emailError}</p>}
          </div>
        </div>

        <div>
          <Label>Phone (optional)</Label>
          <div className="mt-1.5" onBlur={() => touch("phone")}>
            <PhoneInput value={phone} onChange={setPhone} error={phoneError ?? undefined} />
          </div>
        </div>

        <div>
          <Label htmlFor="contact-subject">Subject *</Label>
          <Input
            id="contact-subject"
            maxLength={150}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onBlur={() => touch("subject")}
            aria-invalid={!!subjectError}
            className={cn("mt-1.5 rounded-xl", subjectError && "border-destructive")}
          />
          {subjectError && <p className="mt-1 text-xs text-destructive">{subjectError}</p>}
        </div>

        <div>
          <Label htmlFor="contact-message">Message *</Label>
          <Textarea
            id="contact-message"
            rows={6}
            maxLength={5000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => touch("message")}
            aria-invalid={!!messageError}
            className={cn("mt-1.5 rounded-xl", messageError && "border-destructive")}
          />
          {messageError && <p className="mt-1 text-xs text-destructive">{messageError}</p>}
        </div>

        {TURNSTILE_SITE_KEY && (
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
          />
        )}

        <Button
          onClick={submit}
          disabled={submitting}
          className="electric-glow w-full rounded-full sm:w-auto sm:self-start sm:px-8"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send message
        </Button>
      </div>
    </div>
  );
}
