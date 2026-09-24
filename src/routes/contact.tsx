import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MessageSquare } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ContactForm } from "@/components/site/ContactForm";

const URL = "https://elfoinnovations.com/contact";
const TITLE = "Contact ELFO Innovations | Get in Touch";
const DESC =
  "Have a question or a project in mind? Send ELFO Innovations a message and our team will get back to you by email.";

export const Route = createFileRoute("/contact")({
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
            { "@type": "ListItem", position: 2, name: "Contact", item: URL },
          ],
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PublicLayout>
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:gap-14 lg:px-8">
          <div className="lg:col-span-2">
            <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
              Contact
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Let's talk
            </h1>
            <p className="mt-5 text-muted-foreground">
              Questions, feedback or a project idea? Send us a message and our team will reply by
              email.
            </p>
            <div className="mt-8 space-y-3">
              <div className="glass-card flex items-start gap-4 rounded-2xl p-5">
                <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-semibold">Send us a message</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fill in the form and we'll get your message straight away.
                  </p>
                </div>
              </div>
              <div className="glass-card flex items-start gap-4 rounded-2xl p-5">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-semibold">Confirmation by email</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You'll receive an automatic confirmation once your message is delivered.
                  </p>
                </div>
              </div>
              <div className="glass-card flex items-start gap-4 rounded-2xl p-5">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-semibold">We read every message</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Looking to start a project? Use "Get Started" for a full project inquiry.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
