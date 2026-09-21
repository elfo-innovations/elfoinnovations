// Reusable, responsive HTML email templates with ELFO Innovations branding.
// Pure string builders — safe to import on the server.

const BRAND = {
  name: "ELFO INNOVATIONS",
  navy: "#0A1628",
  card: "#0F1F35",
  electric: "#2E9BFF",
  text: "#E6EDF7",
  muted: "#9AB0CB",
  site: "https://elfoinnovations.com",
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

export function leadReceivedEmail(p: { name: string; leadCode: string }) {
  return shell(
    "We received your inquiry",
    `<h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};">Inquiry received</h1>
     <p style="margin:0 0 14px;">Hi ${esc(p.name)},</p>
     <p style="margin:0 0 14px;color:${BRAND.muted};">Thanks for reaching out to <strong style="color:${BRAND.text};">ELFO Innovations</strong>. We've received your
     project inquiry (reference <strong style="color:${BRAND.electric};">${esc(p.leadCode)}</strong>) and our team is already looking it over.</p>
     <p style="margin:0 0 14px;color:${BRAND.muted};">Someone from our team will reply to this email shortly to discuss next steps. No action is needed from you right now.</p>
     ${button(BRAND.site, "Visit ELFO Innovations")}`,
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

export function invoiceEmail(p: {
  name: string;
  invoiceNumber: string;
  projectName: string;
  currency: string;
  items: { description: string; qty: number; unit_price: number; amount: number }[];
  subtotal: number;
  total: number;
  dueDate: string;
}) {
  const money = (n: number) => Number(n).toLocaleString();
  const rows = p.items
    .map(
      (it) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);color:${BRAND.text};">${esc(it.description)}</td>
        <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);color:${BRAND.muted};text-align:center;">${it.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);color:${BRAND.text};text-align:right;">${p.currency} ${money(it.amount)}</td>
      </tr>`,
    )
    .join("");

  return shell(
    `Invoice ${p.invoiceNumber}`,
    `<h1 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};">Invoice ${esc(p.invoiceNumber)}</h1>
     <p style="margin:0 0 14px;">Hi ${esc(p.name)},</p>
     <p style="margin:0 0 18px;color:${BRAND.muted};">Here's the invoice for <strong style="color:${BRAND.text};">${esc(p.projectName)}</strong>. Due date: <strong style="color:${BRAND.electric};">${esc(p.dueDate)}</strong>.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
       <thead><tr>
         <th style="text-align:left;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.15);color:${BRAND.muted};font-size:12px;text-transform:uppercase;">Description</th>
         <th style="text-align:center;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.15);color:${BRAND.muted};font-size:12px;text-transform:uppercase;">Qty</th>
         <th style="text-align:right;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.15);color:${BRAND.muted};font-size:12px;text-transform:uppercase;">Amount</th>
       </tr></thead>
       <tbody>${rows}</tbody>
     </table>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
       <tr><td style="padding:4px 0;color:${BRAND.muted};">Subtotal</td><td style="padding:4px 0;text-align:right;color:${BRAND.text};">${p.currency} ${money(p.subtotal)}</td></tr>
       <tr><td style="padding:10px 0 0;font-weight:700;color:${BRAND.text};">Total due</td><td style="padding:10px 0 0;text-align:right;font-weight:700;color:${BRAND.electric};">${p.currency} ${money(p.total)}</td></tr>
     </table>
     <p style="margin:18px 0 0;color:${BRAND.muted};">If you have any questions about this invoice, just reply to this email.</p>`,
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
