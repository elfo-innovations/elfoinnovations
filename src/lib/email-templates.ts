// Reusable, responsive HTML email templates with ELFO Innovations branding.
// Pure string builders — safe to import on the server.

const BRAND = {
  name: "ELFO INNOVATIONS",
  navy: "#0A1628",
  card: "#0F1F35",
  electric: "#2E9BFF",
  text: "#E6EDF7",
  muted: "#9AB0CB",
  site: "https://elfoinnovation.lovable.app",
};

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function nl2br(s: string) {
  return esc(s).replace(/\n/g, "<br/>");
}

function shell(title: string, inner: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.navy};border-radius:18px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px 32px;">
          <div style="font-size:20px;font-weight:800;letter-spacing:.14em;color:${BRAND.text};">
            <span style="color:${BRAND.electric};">ELFO</span> INNOVATIONS
          </div>
          <div style="height:3px;width:56px;background:${BRAND.electric};border-radius:99px;margin-top:10px;"></div>
        </td></tr>
        <tr><td style="padding:20px 32px 32px 32px;color:${BRAND.text};font-size:15px;line-height:1.65;">
          ${inner}
        </td></tr>
        <tr><td style="padding:18px 32px 28px 32px;border-top:1px solid rgba(255,255,255,.08);color:${BRAND.muted};font-size:12px;line-height:1.6;">
          © ${new Date().getFullYear()} ${BRAND.name} · <a href="${BRAND.site}" style="color:${BRAND.electric};text-decoration:none;">${BRAND.site.replace("https://", "")}</a><br/>
          Solutions today, success tomorrow.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr><td style="border-radius:999px;background:${BRAND.electric};">
    <a href="${esc(href)}" style="display:inline-block;padding:12px 26px;color:#04101F;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;">${esc(label)}</a>
  </td></tr></table>`;
}

export function applicationReceivedEmail(p: { name: string; role: string }) {
  return shell(
    "We received your application",
    `<h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};">Application received</h1>
     <p style="margin:0 0 14px;">Hi ${esc(p.name)},</p>
     <p style="margin:0 0 14px;color:${BRAND.muted};">Thank you for applying to join <strong style="color:${BRAND.text};">ELFO Innovations</strong> as a
     <strong style="color:${BRAND.electric};">${esc(p.role)}</strong>. Your application is now in review with our engineering team.</p>
     <p style="margin:0 0 14px;color:${BRAND.muted};">We review every application carefully and will get back to you by email with a decision. No action is needed from you right now.</p>
     ${button(BRAND.site, "Explore ELFO Innovations")}`,
  );
}

export function acceptanceEmail(p: {
  name: string;
  message: string;
  loginUrl: string;
  username: string;
  email: string;
  password: string;
}) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:8px 0;color:${BRAND.muted};font-size:13px;width:150px;">${esc(k)}</td>
     <td style="padding:8px 0;color:${BRAND.text};font-size:14px;font-weight:600;">${esc(v)}</td></tr>`;
  return shell(
    "Welcome to ELFO Innovations",
    `<h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};">Welcome aboard, ${esc(p.name)} 🎉</h1>
     <p style="margin:0 0 16px;color:${BRAND.muted};">${nl2br(p.message)}</p>
     <div style="background:${BRAND.card};border:1px solid rgba(46,155,255,.25);border-radius:14px;padding:18px 20px;margin:18px 0;">
       <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${BRAND.electric};font-weight:700;margin-bottom:6px;">Your developer portal access</div>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
         ${row("Username", p.username)}
         ${row("Email", p.email)}
         ${row("Temporary password", p.password)}
       </table>
     </div>
     ${button(p.loginUrl, "Open the Developer Portal")}
     <p style="margin:0;color:${BRAND.muted};font-size:13px;">For your security, please sign in and change your temporary password from
     <strong style="color:${BRAND.text};">My Profile</strong> right after your first login. Never share these credentials with anyone.</p>`,
  );
}

export function rejectionEmail(p: { name: string; message: string }) {
  return shell(
    "Update on your application",
    `<h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};">Update on your application</h1>
     <p style="margin:0 0 14px;">Hi ${esc(p.name)},</p>
     <p style="margin:0 0 16px;color:${BRAND.muted};">${nl2br(p.message)}</p>
     <p style="margin:0 0 14px;color:${BRAND.muted};">We genuinely appreciate the time you took to apply. You are welcome to apply again in the future as our team grows.</p>
     ${button(BRAND.site, "Visit ELFO Innovations")}`,
  );
}
