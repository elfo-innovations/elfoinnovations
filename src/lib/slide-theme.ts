// Tiny external store so the hero slider (deep inside a page) can tell the
// sticky Navbar which color the currently-active slide wants, without prop
// drilling or a React context provider wrapping the whole app. Consumed via
// React's built-in useSyncExternalStore, so no extra dependency is needed.

type Listener = () => void;

let currentColor: string | null = null;
const listeners = new Set<Listener>();

/** Called by PromoHeroSlider whenever the active slide changes. */
export function setSlideThemeColor(color: string | null | undefined) {
  const next = color && color.trim() ? color.trim() : null;
  if (currentColor === next) return;
  currentColor = next;
  listeners.forEach((l) => l());
}

/** Used internally by useSyncExternalStore in Navbar. */
export function subscribeSlideTheme(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Used internally by useSyncExternalStore in Navbar. */
export function getSlideThemeColor() {
  return currentColor;
}
