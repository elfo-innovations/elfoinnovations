import { createServerFn } from "@tanstack/react-start";
import { verifyTurnstileToken } from "@/lib/turnstile-verify.server";

export type ContactSubmitInput = {
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  turnstileToken: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public /contact form. No user auth — Turnstile (Finding 12) is the gate,
// exactly like submitLead in src/lib/leads.functions.ts. The insert uses the
// service-role client because public.contact_messages has no anon INSERT
// grant/policy. Both emails (owner notification + visitor thank-you) are sent
// from here, server-side, so they can't be skipped or spoofed by a client.
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: ContactSubmitInput) => input)
  .handler(async ({ data }) => {
    await verifyTurnstileToken(data.turnstileToken);

    const fullName = String(data.full_name ?? "").trim();
    const email = String(data.email ?? "")
      .trim()
      .toLowerCase();
    const phone = data.phone ? String(data.phone).replace(/\s+/g, "") : null;
    const subject = String(data.subject ?? "").trim();
    const message = String(data.message ?? "").trim();

    if (fullName.length < 2 || fullName.length > 100) throw new Error("Please enter your name.");
    if (!EMAIL_RE.test(email) || email.length > 254)
      throw new Error("Please enter a valid email address.");
    if (phone && phone.length > 32) throw new Error("Please enter a valid phone number.");
    if (subject.length < 3 || subject.length > 150)
      throw new Error("Please enter a subject (3–150 characters).");
    if (message.length < 10 || message.length > 5000)
      throw new Error("Your message must be between 10 and 5000 characters.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const messageCode = `MSG-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      message_code: messageCode,
      full_name: fullName,
      email,
      phone,
      subject,
      message,
    });
    if (error) {
      console.error("[contact] insert failed", error.message);
      throw new Error("We couldn't send your message right now. Please try again.");
    }

    // The message is saved at this point — a mail failure must never turn a
    // successful submission into an error for the visitor. Awaited (not
    // fire-and-forget) because the Worker may be torn down once we return.
    const { sendEmail } = await import("@/lib/email.server");
    const { contactAdminEmail, contactReceivedEmail } = await import("@/lib/email-templates");
    const adminTo = process.env["CONTACT_NOTIFY_EMAIL"] || "elfoinnovations@gmail.com";

    const [adminMail, visitorMail] = await Promise.all([
      sendEmail({
        to: adminTo,
        replyTo: email,
        subject: `New contact message (${messageCode}) — ${subject}`,
        html: contactAdminEmail({ messageCode, name: fullName, email, phone, subject, message }),
      }).catch((e) => ({ sent: false, provider: "error", error: String(e) })),
      sendEmail({
        to: email,
        subject: "We received your message — ELFO Innovations",
        html: contactReceivedEmail({ name: fullName, subject, messageCode }),
      }).catch((e) => ({ sent: false, provider: "error", error: String(e) })),
    ]);
    if (!adminMail.sent) console.error("[contact] owner email not sent:", adminMail.error);
    if (!visitorMail.sent) console.error("[contact] visitor email not sent:", visitorMail.error);

    return { messageCode };
  });
