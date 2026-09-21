import { createServerFn } from "@tanstack/react-start";

type InvoiceEmailInput = {
  to: string;
  name: string;
  invoiceNumber: string;
  projectName: string;
  currency: string;
  items: { description: string; qty: number; unit_price: number; amount: number }[];
  subtotal: number;
  total: number;
  dueDate: string;
};

// Admin-triggered — emails the client a copy of their invoice.
export const sendInvoiceEmail = createServerFn({ method: "POST" })
  .inputValidator((input: InvoiceEmailInput) => input)
  .handler(async ({ data }) => {
    const { sendEmail } = await import("@/lib/email.server");
    const { invoiceEmail } = await import("@/lib/email-templates");

    const result = await sendEmail({
      to: data.to,
      subject: `Invoice ${data.invoiceNumber} — ELFO Innovations`,
      html: invoiceEmail({
        name: data.name,
        invoiceNumber: data.invoiceNumber,
        projectName: data.projectName,
        currency: data.currency,
        items: data.items,
        subtotal: data.subtotal,
        total: data.total,
        dueDate: data.dueDate,
      }),
    }).catch((e) => {
      console.error("[invoice email] send failed", e);
      return { sent: false, provider: "error", error: String(e) };
    });

    if (!result.sent) console.error("[invoice email] not sent:", (result as any).error);

    return { ok: result.sent, error: (result as any).error as string | undefined };
  });
