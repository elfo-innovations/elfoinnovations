import { useEffect, useState } from "react";

/**
 * Colors along the four edges of an image, sampled in segments.
 * Used to fill the leftover space around an image that is shown in full
 * (object-contain), so the picture looks like it continues to the edges of
 * its frame instead of sitting in a foggy/blurred band.
 */
export type EdgeColors = {
  top: string[];
  bottom: string[];
  left: string[];
  right: string[];
  /** natural width / height of the image */
  ratio: number;
};

/** Average the pixels along one edge, split into `segments` chunks. Pure function (no DOM). */
export function segmentColors(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  side: "top" | "bottom" | "left" | "right",
  segments: number,
  depth: number,
): string[] {
  const horizontal = side === "top" || side === "bottom";
  const len = horizontal ? w : h;
  const out: string[] = [];
  let last = "rgb(0,0,0)";

  for (let s = 0; s < segments; s++) {
    const from = Math.floor((s / segments) * len);
    const to = Math.max(from + 1, Math.floor(((s + 1) / segments) * len));
    let r = 0,
      g = 0,
      b = 0,
      n = 0;

    for (let a = from; a < to; a++) {
      for (let d = 0; d < depth; d++) {
        const x = horizontal ? a : side === "left" ? d : w - 1 - d;
        const y = horizontal ? (side === "top" ? d : h - 1 - d) : a;
        const i = (y * w + x) * 4;
        if (data[i + 3] < 200) continue; // ignore transparent pixels
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    }
    if (n > 0) last = `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
    out.push(last);
  }
  return out;
}

export function computeEdgeColors(data: Uint8ClampedArray, w: number, h: number): EdgeColors {
  const depth = 2;
  return {
    top: segmentColors(data, w, h, "top", 12, depth),
    bottom: segmentColors(data, w, h, "bottom", 12, depth),
    left: segmentColors(data, w, h, "left", 8, depth),
    right: segmentColors(data, w, h, "right", 8, depth),
    ratio: w / h,
  };
}

const cache = new Map<string, Promise<EdgeColors | null>>();

/** Loads the image and samples its edges. Resolves null if the browser blocks reading it (CORS). */
export function loadEdgeColors(url: string): Promise<EdgeColors | null> {
  const hit = cache.get(url);
  if (hit) return hit;

  const p = new Promise<EdgeColors | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const max = 96;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(4, Math.round(img.naturalWidth * scale));
        const h = Math.max(4, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const colors = computeEdgeColors(data, w, h);
        // keep the true aspect ratio, not the rounded thumbnail one
        colors.ratio = img.naturalWidth / img.naturalHeight;
        resolve(colors);
      } catch {
        // Canvas tainted by a cross-origin image without CORS headers — caller falls back.
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

  cache.set(url, p);
  return p;
}

export function useEdgeColors(src: string | null | undefined): EdgeColors | null {
  const [colors, setColors] = useState<EdgeColors | null>(null);

  useEffect(() => {
    let alive = true;
    setColors(null);
    if (!src) return;
    loadEdgeColors(src).then((c) => {
      if (alive) setColors(c);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  return colors;
}
