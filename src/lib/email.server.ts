// Server-only email sender.
//
// The app runs on an edge runtime where raw SMTP sockets are unavailable, so
// mail is delivered through the HTTPS API of an SMTP provider. Configure ONE of
// the providers below with environment variables and everything works with no
// further code changes:
//
//   Resend      : RESEND_API_KEY
//   Brevo       : BREVO_API_KEY          (Sendinblue)
//   SMTP2GO     : SMTP2GO_API_KEY
//   Mailgun     : MAILGUN_API_KEY + MAILGUN_DOMAIN
//   Generic     : SMTP_RELAY_URL (+ optional SMTP_RELAY_TOKEN) — receives
//                 JSON { from, to, subject, html }
//
// Shared:
//   MAIL_FROM      e.g. "ELFO Innovations <no-reply@elfoinnovations.com>"
//   MAIL_REPLY_TO  optional

export type SendResult = { sent: boolean; provider: string; error?: string };

function fromAddress() {
  return process.env["MAIL_FROM"] || "ELFO Innovations <no-reply@elfoinnovations.com>";
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  const from = fromAddress();
  const replyTo = opts.replyTo || process.env["MAIL_REPLY_TO"] || undefined;

  try {
    const resend = process.env["RESEND_API_KEY"];
    if (resend) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
          reply_to: replyTo,
        }),
      });
      if (!r.ok) return { sent: false, provider: "resend", error: await r.text() };
      return { sent: true, provider: "resend" };
    }

    const brevo = process.env["BREVO_API_KEY"];
    if (brevo) {
      const m = /^(.*)<(.*)>$/.exec(from);
      const sender = m ? { name: m[1].trim(), email: m[2].trim() } : { email: from };
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevo, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender,
          to: [{ email: opts.to }],
          subject: opts.subject,
          htmlContent: opts.html,
        }),
      });
      if (!r.ok) return { sent: false, provider: "brevo", error: await r.text() };
      return { sent: true, provider: "brevo" };
    }

    const smtp2go = process.env["SMTP2GO_API_KEY"];
    if (smtp2go) {
      const r = await fetch("https://api.smtp2go.com/v3/email/send", {
        method: "POST",
        headers: { "X-Smtp2go-Api-Key": smtp2go, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: from,
          to: [opts.to],
          subject: opts.subject,
          html_body: opts.html,
        }),
      });
      if (!r.ok) return { sent: false, provider: "smtp2go", error: await r.text() };
      return { sent: true, provider: "smtp2go" };
    }

    const mg = process.env["MAILGUN_API_KEY"];
    const mgDomain = process.env["MAILGUN_DOMAIN"];
    if (mg && mgDomain) {
      const body = new URLSearchParams({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      const r = await fetch(`https://api.mailgun.net/v3/${mgDomain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${mg}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!r.ok) return { sent: false, provider: "mailgun", error: await r.text() };
      return { sent: true, provider: "mailgun" };
    }

    const relay = process.env["SMTP_RELAY_URL"];
    if (relay) {
      const token = process.env["SMTP_RELAY_TOKEN"];
      const r = await fetch(relay, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
      });
      if (!r.ok) return { sent: false, provider: "smtp-relay", error: await r.text() };
      return { sent: true, provider: "smtp-relay" };
    }

    return {
      sent: false,
      provider: "none",
      error:
        "No email provider configured. Add RESEND_API_KEY, BREVO_API_KEY, SMTP2GO_API_KEY, MAILGUN_API_KEY + MAILGUN_DOMAIN, or SMTP_RELAY_URL.",
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { sent: false, provider: "unknown", error: message };
  }
}
