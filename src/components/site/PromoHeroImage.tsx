export function PromoHeroImage({ imageUrl, theme }: { imageUrl: string | null; theme: "light" | "dark" }) {
  if (!imageUrl) return null;
  const isDark = theme === "dark";

  return (
    <section className={`relative w-full overflow-hidden ${isDark ? "bg-[#050914]" : "bg-muted"}`}>
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </section>
  );
}