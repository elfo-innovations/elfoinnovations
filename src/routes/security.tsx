import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ShieldAlert } from "lucide-react";

const URL = "https://elfoinnovations.com/security";
const TITLE = "Security & Responsible Disclosure | ELFO Innovations";
const DESC =
  "How to report a security vulnerability to ELFO Innovations, what's in scope, and what to expect after you report.";
const LAST_UPDATED = "September 24, 2026";

export const Route = createFileRoute("/security")({
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
            { "@type": "ListItem", position: 2, name: "Security", item: URL },
          ],
        }),
      },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <PublicLayout>
      <section className="px-4 pb-20 pt-12 sm:pt-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            <ShieldAlert className="h-3.5 w-3.5" /> ELFO Innovations
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Security &amp; Responsible Disclosure
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6">
          <p>
            We take the security of our website, client and developer portals, and client data
            seriously. If you believe you've found a security vulnerability affecting ELFO
            Innovations, we want to hear about it, and we ask that you report it responsibly
            following the process below.
          </p>

          <h2>1. How to Report</h2>
          <p>
            Email <a href="mailto:elfoinnovations@gmail.com">elfoinnovations@gmail.com</a> with a
            description of the issue, the steps to reproduce it, and its potential impact. Please
            include enough detail (URLs, request/response examples, screenshots, or a
            proof-of-concept) for us to reproduce and verify it. A machine-readable version of this
            contact is also published at{" "}
            <a href="/.well-known/security.txt">/.well-known/security.txt</a>, in the standard
            security.txt format.
          </p>

          <h2>2. What to Expect</h2>
          <p>
            We aim to acknowledge new reports within 24&ndash;48 hours. After that, we'll
            investigate, keep you reasonably informed of our progress, and let you know once the
            issue is resolved. Response and fix timelines vary with severity and complexity, but we
            will keep you updated rather than go silent.
          </p>

          <h2>3. Scope</h2>
          <p>In scope:</p>
          <ul>
            <li>The elfoinnovations.com website and its public-facing forms and pages.</li>
            <li>
              The client, developer, and admin dashboards and their authentication/authorization.
            </li>
            <li>Our backend APIs and database access controls (Supabase-backed).</li>
          </ul>
          <p>Out of scope:</p>
          <ul>
            <li>
              Vulnerabilities in third-party services we use but don't control (for example,
              Supabase, Cloudflare, Google Translate/Fonts, or Cloudflare Turnstile itself) &mdash;
              please report those directly to the relevant provider.
            </li>
            <li>
              Automated vulnerability scanning that generates significant traffic, denial-of-service
              testing, physical or social-engineering attacks (including phishing our team), and
              spam or content-injection via public forms with no security impact.
            </li>
          </ul>

          <h2>4. Responsible Disclosure</h2>
          <p>
            Please report vulnerabilities privately, using the contact above, and give us a
            reasonable amount of time to investigate and address the issue before disclosing it
            publicly or to anyone else. Do not access, modify, or delete data that isn't your own
            while testing, and stop testing and report immediately if you do encounter real client
            or user data. Acting in good faith and within this policy is something we appreciate,
            and we won't pursue legal action against researchers who follow it.
          </p>

          <h2>5. Changes to This Page</h2>
          <p>
            We may revise this page from time to time to reflect changes in our systems or process.
            When we do, we will update the &ldquo;Last updated&rdquo; date at the top of this page.
          </p>

          <h2>6. Contact Information</h2>
          <p>
            For anything else related to security, contact us at{" "}
            <a href="mailto:elfoinnovations@gmail.com">elfoinnovations@gmail.com</a>.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
