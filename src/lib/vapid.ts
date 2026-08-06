// Public VAPID key — safe to expose to browsers.
export const VAPID_PUBLIC_KEY =
  "BDkR0znrEFeVbrRifJ0VEmC8Zr43zZV5Pz12KE4XQuNUgEPYWSNfQ-Vq6w9-nKU7X0Y78fNPje6xjoPZI4ZK8RQ";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
