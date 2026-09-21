import { createServerFn } from "@tanstack/react-start";

type LeadNotifyInput = {
  lead_code: string;
  full_name: string;
  email: string;
  phone: string;
  project_description: string;
  budget_readiness: string;
  estimated_budget?: string | null;
  timeline?: string | null;
};

// No auth required — this fires right after the public inquiry form insert.
// Sends BOTH the admin notification email and a confirmation email to the
// client who submitted the form. Admin push notification is handled
// separately by the public.notify_new_lead() DB trigger on insert.
export const notifyAdminOfLead = createServerFn({ method: "POST" })
  .inputValidator((input: LeadNotifyInput) => input)
  .handler(async ({ data }) => {
    const { sendEmail } = await import("@/lib/email.server");
    const { leadReceivedEmail } = await import("@/lib/email-templates");
    const adminTo = process.env["ADMIN_NOTIFY_EMAIL"] || "support@elfoinnovations.com"; // your Zoho inbox

    const adminMail = await sendEmail({
      to: adminTo,
      replyTo: data.email, // admin hits "Reply" in their inbox → goes straight to the client
      subject: `New inquiry (${data.lead_code}) — ${data.full_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2>New lead: ${data.full_name}</h2>
          <p><b>Email:</b> ${data.email}<br/>
             <b>Phone:</b> ${data.phone}<br/>
             <b>Budget:</b> ${data.budget_readiness}${data.estimated_budget ? " — " + data.estimated_budget : ""}<br/>
             <b>Timeline:</b> ${data.timeline || "—"}</p>
          <p><b>Description:</b><br/>${data.project_description}</p>
          <p style="color:#888;font-size:12px">Lead code: ${data.lead_code} — reply to this email to respond directly to the client.</p>
        </div>`,
    }).catch((e) => {
      console.error("[lead notify] admin email failed", e);
      return { sent: false, provider: "error", error: String(e) };
    });

    const clientMail = await sendEmail({
      to: data.email,
      subject: "We received your inquiry — ELFO Innovations",
      html: leadReceivedEmail({ name: data.full_name, leadCode: data.lead_code }),
    }).catch((e) => {
      console.error("[lead notify] client email failed", e);
      return { sent: false, provider: "error", error: String(e) };
    });

    if (!adminMail.sent) console.error("[lead notify] admin email not sent:", adminMail.error);
    if (!clientMail.sent) console.error("[lead notify] client email not sent:", clientMail.error);

    return { ok: true, adminEmailSent: adminMail.sent, clientEmailSent: clientMail.sent };
  });
