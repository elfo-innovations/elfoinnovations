import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInquiry } from "@/hooks/use-inquiry";

export function CtaBanner() {
  const { open } = useInquiry();
  return (
    <section className="border-t bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="glass-card relative overflow-hidden rounded-3xl p-10 text-center electric-glow sm:p-16">
          <div className="absolute inset-0 -z-10 opacity-30 circuit-pattern" />
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Let's build something <span className="electric-text">extraordinary.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tell us about your project. We'll come back within 24 hours with a plan.
          </p>
          <Button size="lg" onClick={open} className="mt-8 rounded-full px-8 electric-glow">
            Start your project <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
