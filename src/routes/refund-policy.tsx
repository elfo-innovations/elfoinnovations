import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Wallet } from "lucide-react";

const URL = "https://elfoinnovations.com/refund-policy";
const TITLE = "Refund & Cancellation Policy | ELFO Innovations";
const DESC =
  "Read ELFO Innovations' Refund & Cancellation Policy, covering deposits, mid-project cancellations, and payment methods for client engagements.";
const LAST_UPDATED = "September 24, 2026";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://elfoinnovations.com/",
            },
            { "@type": "ListItem", position: 2, name: "Refund & Cancellation Policy", item: URL },
          ],
        }),
      },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <PublicLayout>
      <section className="px-4 pb-20 pt-12 sm:pt-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            <Wallet className="h-3.5 w-3.5" /> ELFO Innovations
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6">
          <p>
            This Refund &amp; Cancellation Policy describes how ELFO Innovations
            (&ldquo;ELFO,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) handles
            deposits, cancellations, and payments for client engagements. It works alongside our{" "}
            <a href="/terms">Terms &amp; Conditions</a>, which continue to govern the relationship
            generally. The exact commercial terms for any project — including deposit amount,
            payment schedule, and milestones — are set out in the proposal, statement of work, or
            signed agreement for that engagement; where this page and a signed agreement conflict,
            the signed agreement controls.
          </p>

          <h2>1. Deposits</h2>
          <p>
            We typically require an upfront deposit before starting a project. If a client cancels
            before any work has begun, the deposit is refundable in full. Once work on the project
            has started, the deposit is considered earned and is no longer refundable — it covers
            the time and resources committed to beginning the engagement.
          </p>

          <h2>2. Cancelling a Project Already in Progress</h2>
          <p>
            If a client cancels a project after work has started, we do not apply a single fixed
            formula. Instead, we look at what has already been delivered or completed — such as
            finished milestones, drafts, or in-progress work — and work out a fair resolution with
            the client on a case-by-case basis. This is intentional: project scopes and stages of
            completion vary too much for one flat rule to be fair to every client. Where a signed
            agreement for the project specifies its own cancellation terms, those terms are used
            instead.
          </p>

          <h2>3. Payment Methods</h2>
          <p>
            We accept a range of payment methods, and the method used varies by client depending on
            their location and preference (for example, bank transfer or supported online payment
            services). The specific payment method and any related processing details are agreed
            with each client individually before work begins. We are not responsible for delays or
            fees imposed by banks, payment processors, or currency conversion outside our control.
          </p>

          <h2>4. Requesting a Refund or Discussing a Cancellation</h2>
          <p>
            If you would like to cancel an active engagement or discuss a refund, contact us as
            early as possible at{" "}
            <a href="mailto:support@elfoinnovations.com">support@elfoinnovations.com</a> with your
            project or invoice details. We will review the request and respond with next steps based
            on the sections above.
          </p>

          <h2>5. Changes to This Policy</h2>
          <p>
            We may revise this Policy from time to time to reflect changes in our business
            practices. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of
            this page. This Policy does not apply retroactively to change the terms of an engagement
            already governed by a signed agreement.
          </p>

          <h2>6. Contact Information</h2>
          <p>
            If you have questions about this Policy, please contact us at{" "}
            <a href="mailto:support@elfoinnovations.com">support@elfoinnovations.com</a>.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
