import { useState } from "react";
import { AboutSection } from "./AboutSection";
import { CompanyProfileSection } from "./CompanyProfileSection";
import { Button } from "@/components/ui/button";
import { Users, Building2 } from "lucide-react";

export function AboutCompanyToggle() {
  const [view, setView] = useState<"about" | "company">("about");
  return (
    <section id="about-company" className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto inline-flex w-full max-w-md items-center justify-center gap-1 rounded-full border bg-card p-1 sm:w-auto">
          <Button
            variant={view === "about" ? "default" : "ghost"}
            onClick={() => setView("about")}
            className="flex-1 rounded-full sm:flex-none"
            size="sm"
          >
            <Users className="mr-2 h-4 w-4" /> About Us
          </Button>
          <Button
            variant={view === "company" ? "default" : "ghost"}
            onClick={() => setView("company")}
            className="flex-1 rounded-full sm:flex-none"
            size="sm"
          >
            <Building2 className="mr-2 h-4 w-4" /> About Company
          </Button>
        </div>
      </div>
      <div className="-mt-px">
        {view === "about" ? <AboutSection /> : <CompanyProfileSection />}
      </div>
    </section>
  );
}