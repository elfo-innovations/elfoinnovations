import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ShieldCheck } from "lucide-react";

const URL = "https://elfoinnovations.com/privacy";
const TITLE = "Privacy Policy | ELFO Innovations";
const DESC =
  "Read the Privacy Policy for ELFO Innovations' website, including what information we collect through contact and developer application forms, how it's used, stored, and your rights.";
const LAST_UPDATED = "September 23, 2026";

export const Route = createFileRoute("/privacy")({
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
            { "@type": "ListItem", position: 2, name: "Privacy Policy", item: URL },
          ],
        }),
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="px-4 pb-20 pt-12 sm:pt-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> ELFO Innovations
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6">
          <p>
            This Privacy Policy explains how ELFO Innovations (&ldquo;ELFO,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, stores, and protects information
            when you visit our website or submit information through it. By using our website, you
            agree to the practices described in this Policy.
          </p>

          <h2>1. Information You Provide to Us</h2>
          <p>
            We collect information that you voluntarily submit through forms on our website,
            including:
          </p>
          <ul>
            <li>
              <strong>Contact and project inquiries:</strong> your name, email address, phone
              number, country, company (if applicable), a description of your project, budget
              readiness, estimated budget, timeline, and your preferred method of contact.
            </li>
            <li>
              <strong>Developer applications:</strong> your name, email address, phone number, the
              role you're applying for, your current employment status, a GitHub URL and,
              optionally, a portfolio URL, a short statement of motivation, and a resume file (PDF)
              that you upload.
            </li>
          </ul>
          <p>
            We do not require you to submit information beyond what a given form asks for, and we do
            not knowingly collect more than what is needed to respond to your inquiry or
            application.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>Information you submit is used to:</p>
          <ul>
            <li>Respond to your inquiry, request, or application.</li>
            <li>
              Evaluate developer applications, including reviewing your resume and the links you
              provide.
            </li>
            <li>Communicate with you about a project, engagement, or application status.</li>
            <li>
              Maintain internal records of inquiries and applications so we can follow up
              appropriately.
            </li>
            <li>Detect and prevent duplicate, fraudulent, or abusive submissions to our forms.</li>
          </ul>
          <p>
            We do not sell your personal information, and we do not use it for unrelated marketing
            purposes without your consent.
          </p>

          <h2>3. Data Storage &amp; Security</h2>
          <p>
            Information submitted through our forms is stored in our database and, for resumes, in
            private file storage. Access to this data is restricted to authorized ELFO team members
            who need it to respond to inquiries or review applications; resume files in particular
            are not accessible through the browser and can only be written or read through
            server-side, authenticated processes. We take reasonable technical and organizational
            measures to protect the information we hold, including verifying that form submissions
            come from a real visitor (rather than automated abuse) before they are stored. That
            said, no method of electronic storage or transmission is completely secure, and we
            cannot guarantee absolute security.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>
            We rely on a limited set of third-party service providers to operate the website and
            process the information described above:
          </p>
          <ul>
            <li>
              <strong>Hosting and infrastructure:</strong> our website is hosted and served through
              Cloudflare's platform.
            </li>
            <li>
              <strong>Database and storage:</strong> form submissions and resume files are stored
              using Supabase, our database and file-storage provider.
            </li>
            <li>
              <strong>Bot and spam prevention:</strong> our contact and developer-application forms
              use Cloudflare Turnstile to verify submissions are coming from a real visitor before
              they are processed.
            </li>
            <li>
              <strong>Translation:</strong> if you choose to translate the site into another
              language, that feature is provided by Google Translate.
            </li>
            <li>
              <strong>Fonts:</strong> we load some typefaces from Google Fonts.
            </li>
            <li>
              <strong>Email delivery:</strong> transactional emails (for example, confirming receipt
              of a developer application) are sent through an email delivery provider.
            </li>
          </ul>
          <p>
            These providers process information only to the extent necessary to provide their
            respective service to us, and are subject to their own privacy practices and terms. We
            do not control, and are not responsible for, the privacy practices of third-party
            services you interact with independently of our website.
          </p>

          <h2>5. Cookies &amp; Similar Technologies</h2>
          <p>
            Our website uses cookies and similar technologies in a limited way — primarily to
            support core functionality, such as remembering your selected language when using the
            translation feature described above. We do not currently use third-party advertising or
            tracking cookies. If this changes in the future, we will update this Policy accordingly.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain information submitted through our forms for as long as reasonably necessary to
            fulfil the purpose it was collected for — for example, to respond to an inquiry,
            evaluate an application, or maintain a record of an engagement — and as needed to comply
            with our legal or operational obligations. When information is no longer needed for
            these purposes, we take reasonable steps to delete or anonymize it.
          </p>

          <h2>7. Your Rights &amp; Requests</h2>
          <p>
            You may ask us to access, correct, or delete the personal information you have submitted
            to us, or ask us to stop using it for a particular purpose. To make such a request,
            please contact us using the details below. We will respond to legitimate requests within
            a reasonable timeframe, and may need to verify your identity before acting on a request.
            Depending on your location, you may also have additional rights under applicable data
            protection law.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Our website and Services are intended for business and professional use and are not
            directed at children. We do not knowingly collect personal information from children.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            the services we use, or legal requirements. When we do, we will update the &ldquo;Last
            updated&rdquo; date at the top of this page. We encourage you to review this page
            periodically.
          </p>

          <h2>10. Contact Information</h2>
          <p>
            If you have questions about this Privacy Policy or wish to make a request regarding your
            information, please contact us at{" "}
            <a href="mailto:support@elfoinnovations.com">support@elfoinnovations.com</a>.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
