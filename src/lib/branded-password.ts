// Branded password generator: "Elfo-XXXXXXXXXX$" style.
export function generateBrandedPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(10);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  let core = "";
  for (let i = 0; i < bytes.length; i++) core += alphabet[bytes[i] % alphabet.length];
  return `Elfo-${core}$`;
}
