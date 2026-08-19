import { useState } from "react";
import {
  Download,
  FileText,
  Sparkles,
  Shield,
  Zap,
  Layers,
  Rocket,
  Heart,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFollowUs } from "@/hooks/use-follow-us";
import { BecomeDeveloperButton } from "@/components/recruitment/DeveloperApplicationModal";

import profilePdf from "@/assets/Elfo-Innovations-Company-Profile.pdf";
// 1) Drop your FBR registration PDF into src/assets/ with this exact name
//    (or rename this import to match whatever you name the file).
import fbrCertificatePdf from "@/assets/Elfo-Innovations-FBR-Registration.pdf";

const PILLARS = [
  { icon: Layers, title: "Full-Service", desc: "End-to-end development across web, mobile, cloud and enterprise." },
  { icon: Sparkles, title: "Innovative", desc: "Creative solutions built on modern, proven technologies." },
  { icon: Shield, title: "Secure", desc: "Robust, reliable and secure by design at every layer." },
  { icon: Rocket, title: "Scalable", desc: "Engineered to grow with your ambitions and your users." },
];

export function CompanyProfileSection() {
  const [open, setOpen] = useState(false);
  const [fbrOpen, setFbrOpen] = useState(false);
  const { open: openFollow } = useFollowUs();

  return (
    <section id="company" className="border-t bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* Left: About copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> About the Company
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Turning ideas into <span className="electric-text">powerful software</span>
            </h2>
            <p className="mt-5 text-muted-foreground">
              <strong>ELFO Innovations</strong> is a full-service software development company delivering
              innovative, scalable and secure digital solutions for businesses of all sizes. With a strong
              foundation in modern technologies and agile delivery, we help organizations turn ideas into
              products that ship — and scale.
            </p>
            <p className="mt-4 text-muted-foreground">
              Our expertise spans web, mobile, cloud and enterprise software. We work closely with every
              client to understand their goals and craft solutions that improve efficiency, elevate user
              experience, and accelerate growth.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {PILLARS.map((p) => (
                <div key={p.title} className="glass-card flex items-start gap-3 rounded-2xl p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{p.title}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FBR Registered trust badge card */}
            <div className="glass-card mt-4 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    FBR Registered
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Registered with the Federal Board of Revenue, Government of Pakistan.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  onClick={() => setFbrOpen(true)}
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-full sm:flex-none"
                >
                  <FileText className="mr-2 h-3.5 w-3.5" /> View Certificate
                </Button>
                <a
                  href={fbrCertificatePdf}
                  download="Elfo-Innovations-FBR-Registration.pdf"
                  className="flex-1 sm:flex-none"
                >
                  <Button size="sm" className="w-full rounded-full electric-glow">
                    <Download className="mr-2 h-3.5 w-3.5" /> Download
                  </Button>
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={openFollow} variant="outline" className="rounded-full">
                <Heart className="mr-2 h-4 w-4 text-primary" /> Follow Us
              </Button>
              <BecomeDeveloperButton />
            </div>
          </div>

          {/* Right: Company Profile PDF card */}
          <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="absolute inset-0 opacity-40 circuit-pattern" />
            <div className="relative flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                <FileText className="h-3.5 w-3.5" /> Company Profile
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                See our full company profile
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A detailed look at who we are, our mission and vision, services, technology stack and
                partnership opportunities — packaged as a downloadable PDF.
              </p>

              <ul className="mt-5 space-y-2 text-sm">
                {[
                  "Introduction & about us",
                  "Mission, vision & core values",
                  "Services & delivery model",
                  "Technology stack",
                  "Partnership opportunities",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-primary" /> {t}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
                <Button onClick={() => setOpen(true)} className="flex-1 rounded-full electric-glow">
                  <FileText className="mr-2 h-4 w-4" /> See Company Profile
                </Button>
                <a href={profilePdf} download="Elfo-Innovations-Company-Profile.pdf" className="flex-1">
                  <Button variant="outline" className="w-full rounded-full">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Profile dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3 space-y-0">
            <DialogTitle className="text-sm sm:text-base">ELFO Innovations — Company Profile</DialogTitle>
            <a href={profilePdf} download="Elfo-Innovations-Company-Profile.pdf">
              <Button size="sm" variant="outline" className="rounded-full">
                <Download className="mr-2 h-3.5 w-3.5" /> Download
              </Button>
            </a>
          </DialogHeader>
          <object data={profilePdf} type="application/pdf" className="h-full w-full">
            <iframe src={profilePdf} className="h-full w-full" title="Company Profile PDF" />
          </object>
        </DialogContent>
      </Dialog>

      {/* FBR Registration Certificate dialog */}
      <Dialog open={fbrOpen} onOpenChange={setFbrOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3 space-y-0">
            <DialogTitle className="text-sm sm:text-base">ELFO Innovations — FBR Registration Certificate</DialogTitle>
            <a href={fbrCertificatePdf} download="Elfo-Innovations-FBR-Registration.pdf">
              <Button size="sm" variant="outline" className="rounded-full">
                <Download className="mr-2 h-3.5 w-3.5" /> Download
              </Button>
            </a>
          </DialogHeader>
          <object data={fbrCertificatePdf} type="application/pdf" className="h-full w-full">
            <iframe src={fbrCertificatePdf} className="h-full w-full" title="FBR Registration Certificate PDF" />
          </object>
        </DialogContent>
      </Dialog>
    </section>
  );
}