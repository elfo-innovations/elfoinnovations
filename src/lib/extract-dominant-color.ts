/**
 * Extracts a representative "brand" color from an image — entirely
 * client-side via <canvas>, no external service or library.
 *
 * How it works:
 *  1. Draw the image scaled down onto a tiny (48x48) canvas — fast to sample.
 *  2. Convert every sampled pixel to HSL and bucket it into one of 24 hue
 *     "wedges" (15° each), weighted by how saturated + mid-toned it is.
 *     This favors vivid, colorful pixels over near-white/near-black ones,
 *     so a photo with a purple-lit background reliably picks purple,
 *     not a washed-out gray average.
 *  3. Return the average RGB of the winning hue bucket as a hex string.
 *  4. If the image is basically grayscale (no bucket wins), fall back to a
 *     plain average of the non-extreme pixels.
 *
 * Returns null if the image can't be read (CORS-blocked, failed to load,
 * etc.) — callers should just skip the auto-color in that case.
 */
export function extractDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = Array.from({ length: 24 }, () => ({ count: 0, r: 0, g: 0, b: 0, weight: 0 }));
        let grayR = 0, grayG = 0, grayB = 0, grayCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue; // skip transparent pixels

          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const l = (max + min) / 2 / 255;
          const d = max - min;
          const s = d === 0 ? 0 : d / (255 - Math.abs(max + min - 255));

          if (l > 0.94 || l < 0.06) continue; // skip near-white / near-black padding

          if (s < 0.15) {
            grayR += r; grayG += g; grayB += b; grayCount++;
            continue;
          }

          let h = 0;
          if (max === r) h = ((g - b) / d) % 6;
          else if (max === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;
          h *= 60;
          if (h < 0) h += 360;

          const idx = Math.floor(h / 15) % 24;
          const bucket = buckets[idx];
          const weight = s * (1 - Math.abs(l - 0.5)); // prefer saturated, mid-tone pixels
          bucket.count++;
          bucket.r += r; bucket.g += g; bucket.b += b;
          bucket.weight += weight;
        }

        const winner = buckets.reduce((best, bkt) => (bkt.weight > best.weight ? bkt : best), buckets[0]);

        let r: number, g: number, b: number;
        if (winner.count > 0 && winner.weight > 0) {
          r = Math.round(winner.r / winner.count);
          g = Math.round(winner.g / winner.count);
          b = Math.round(winner.b / winner.count);
        } else if (grayCount > 0) {
          r = Math.round(grayR / grayCount);
          g = Math.round(grayG / grayCount);
          b = Math.round(grayB / grayCount);
        } else {
          return resolve(null);
        }

        const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
        resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
      } catch {
        // Canvas got "tainted" by a cross-origin image without CORS headers,
        // or some other failure — just skip auto-color, never break the page.
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}