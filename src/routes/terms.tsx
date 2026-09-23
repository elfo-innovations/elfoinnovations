import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Scale } from "lucide-react";

const URL = "https://elfoinnovations.com/terms";
const TITLE = "Terms & Conditions | ELFO Innovations";
const DESC =
  "Read the Terms & Conditions governing use of ELFO Innovations' website and services, including user responsibilities, intellectual property, and liability.";
const LAST_UPDATED = "September 23, 2026";

export const Route = createFileRoute("/terms")({
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
            { "@type": "ListItem", position: 2, name: "Terms & Conditions", item: URL },
          ],
        }),
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicLayout>
      <section className="px-4 pb-20 pt-12 sm:pt-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            <Scale className="h-3.5 w-3.5" /> ELFO Innovations
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6">
          <p>
            These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the
            ELFO Innovations website and the services described on it (together, the
            &ldquo;Services&rdquo;). By accessing or using the Services, you agree to be bound by
            these Terms. If you do not agree, please do not use the Services.
          </p>

          <h2>1. Introduction &amp; Acceptance</h2>
          <p>
            ELFO Innovations (&ldquo;ELFO,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) provides this website and related services to prospective and
            existing clients, job applicants, and visitors. Using the Services in any way — browsing
            the site, submitting an inquiry, applying as a developer, or engaging us for a project —
            means you accept these Terms and any policies referenced in them. We may update these
            Terms from time to time, as described in the &ldquo;Changes to These Terms&rdquo;
            section below.
          </p>

          <h2>2. Services</h2>
          <p>
            ELFO Innovations offers custom software development and related services, which may
            include web, mobile, SaaS, and enterprise solutions, along with associated consulting,
            design, and support work. The specific scope, deliverables, timeline, and commercial
            terms for any engagement are set out separately in a proposal, statement of work, or
            signed agreement between ELFO and the client. Nothing on this website constitutes a
            binding offer, quote, or guarantee of pricing, availability, or outcome for any
            particular project; such details are established only through a direct agreement with
            our team.
          </p>

          <h2>3. User Responsibilities</h2>
          <p>When using the Services, you agree to:</p>
          <ul>
            <li>
              Provide accurate, current, and complete information when submitting inquiries,
              applications, or other forms.
            </li>
            <li>
              Use the Services only for lawful purposes and in a manner consistent with these Terms.
            </li>
            <li>
              Not attempt to interfere with, disrupt, or compromise the security or proper
              functioning of the website or any related systems.
            </li>
            <li>
              Not misrepresent your identity or affiliation, or submit content on behalf of others
              without authorization.
            </li>
            <li>
              Keep any account credentials associated with client, developer, or admin portals
              confidential and secure.
            </li>
          </ul>
          <p>
            We reserve the right to suspend or restrict access to the Services for anyone who
            violates these responsibilities.
          </p>

          <h2>4. Intellectual Property</h2>
          <p>
            Unless otherwise stated, all content on this website — including text, graphics, logos,
            the ELFO Innovations name and branding, and the underlying design and software — is
            owned by ELFO Innovations or its licensors and is protected by applicable intellectual
            property laws. Deliverables produced for a client under a separate signed agreement are
            governed by the intellectual property terms in that agreement, which take precedence
            over this website for that engagement. No rights are granted to you under these Terms
            except the limited right to view and use the website for its intended purpose.
          </p>

          <h2>5. Website &amp; Content Usage</h2>
          <p>
            You may view and use this website for personal, non-commercial, informational purposes.
            You may not copy, reproduce, republish, scrape, or distribute substantial portions of
            the site's content without our prior written consent. We may update, modify, or remove
            content on this website at any time without notice, and we do not guarantee that any
            particular page, feature, or piece of content will remain available.
          </p>

          <h2>6. Third-Party Services</h2>
          <p>
            The Services may reference, link to, or integrate with third-party tools and platforms
            (for example, hosting, analytics, communication, or payment providers). We do not
            control these third parties and are not responsible for their content, availability, or
            practices. Your use of any third-party service is subject to that third party's own
            terms and privacy practices.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, ELFO Innovations and its team members
            will not be liable for any indirect, incidental, special, consequential, or punitive
            damages, or any loss of data, revenue, or business opportunity, arising out of or
            related to your use of the Services or this website. The Services and website are
            provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without
            warranties of any kind, express or implied, except where such warranties cannot be
            excluded by law. Nothing in these Terms limits liability that cannot lawfully be
            limited. Specific liability terms for a client engagement are governed by the relevant
            signed agreement.
          </p>

          <h2>8. Changes to These Terms</h2>
          <p>
            We may revise these Terms from time to time to reflect changes in our Services, legal
            requirements, or business practices. When we do, we will update the &ldquo;Last
            updated&rdquo; date at the top of this page. Continued use of the Services after any
            changes take effect constitutes your acceptance of the revised Terms. We encourage you
            to review this page periodically.
          </p>

          <h2>9. Contact Information</h2>
          <p>
            If you have questions about these Terms, please contact us at{" "}
            <a href="mailto:support@elfoinnovations.com">support@elfoinnovations.com</a>.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
