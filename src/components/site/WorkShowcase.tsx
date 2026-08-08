import { ExternalLink, Github } from "lucide-react";
import img1 from "@/assets/work-image-30.png";
import img2 from "@/assets/work-image-31.png";
import img3 from "@/assets/work-image-32.png";
import img4 from "@/assets/work-image-33.png";
import img5 from "@/assets/work-image-34.png";
import img6 from "@/assets/work-hero-1.png";

type Work = { title: string; tag: string; image: string; repo: string | null };

const WORKS: Work[] = [
  { title: "Health Care Management System", tag: "Healthcare Platform", image: img1, repo: "https://github.com/elfo-innovations/Health-Care-Management-System" },
  { title: "WakeOye — Instant Tea & Coffee", tag: "Brand Website", image: img2, repo: "https://github.com/elfo-innovations/wakeoye" },
  { title: "Online Auction", tag: "Marketplace", image: img3, repo: "https://github.com/elfo-innovations/online-auction" },
  { title: "Hot Coffee", tag: "Restaurant & Café", image: img4, repo: null },
  { title: "Orebi Shopping", tag: "E-Commerce", image: img5, repo: null },
  { title: "MaruDry Fruit E-Commerce", tag: "E-Commerce", image: img6, repo: "https://github.com/elfo-innovations/MaruDry-Fruit-Ecommerce" },
];

export function WorkShowcase() {
  return (
    <section id="work" className="border-t bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">Our Work</div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Services in <span className="electric-text">action</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real products we designed and engineered — explore the source code where it's public.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WORKS.map((w) => (
            <article key={w.title} className="glass-card group overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:electric-glow">
              <div className="aspect-[16/10] overflow-hidden border-b bg-muted">
                <img
                  src={w.image}
                  alt={`${w.title} project by ELFO Innovations`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]"
                />
              </div>
              <div className="p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary">{w.tag}</div>
                <h3 className="mt-2 font-display text-lg font-semibold">{w.title}</h3>
                <div className="mt-4">
                  {w.repo ? (
                    <a
                      href={w.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                    >
                      <Github className="h-3.5 w-3.5" /> View Source
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      Private client project
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
