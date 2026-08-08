import { cn } from "@/lib/utils";
import logoLight from "@/assets/elfo-logo-light.png";
import logoDark from "@/assets/elfo-logo-dark.png";

export function ElfoLogo({ className, size = "md" }: { className?: string; showTag?: boolean; size?: "sm" | "md" | "lg" }) {
  const h =
    size === "sm"
      ? "h-8 sm:h-9 md:h-10"
      : size === "lg"
      ? "h-12 sm:h-14 md:h-16 lg:h-20"
      : "h-10 sm:h-11 md:h-12 lg:h-14";
  return (
    <div className={cn("flex items-center", className)}>
      <img src={logoLight} alt="ELFO Innovations" className={cn(h, "w-auto object-contain block dark:hidden")} />
      <img src={logoDark} alt="ELFO Innovations" className={cn(h, "w-auto object-contain hidden dark:block")} />
    </div>
  );
}

export function ElfoLogoMark({ className }: { className?: string }) {
  return (
    <>
      <img src={logoLight} alt="ELFO Innovations" className={cn("object-contain block dark:hidden", className)} />
      <img src={logoDark} alt="ELFO Innovations" className={cn("object-contain hidden dark:block", className)} />
    </>
  );
}
