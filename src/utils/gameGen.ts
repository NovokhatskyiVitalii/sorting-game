import type { Dot } from "../slices/gameSlice";
import { nanoid } from "nanoid";
import { mulberry32 } from "./seedGenerator";

export function genDots(
  seed: number,
  colorsCount: number,
  perColor: number,
  width: number,
  height: number
): Dot[] {
  const rnd = mulberry32(seed);
  const margin = 80;
  const areaW = Math.max(0, width - margin * 2);
  const areaH = Math.max(0, height - margin * 2);

  const dots: Dot[] = [];
  for (let c = 0; c < colorsCount; c++) {
    for (let i = 0; i < perColor; i++) {
      dots.push({
        id: nanoid(),
        c,
        x: margin + rnd() * areaW,
        y: margin + rnd() * areaH,
        vx: (rnd() * 2 - 1) * 0.2,
        vy: (rnd() * 2 - 1) * 0.2,
      });
    }
  }
  return dots;
}

function percentile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(
    a.length - 1,
    Math.max(0, Math.floor(p * (a.length - 1)))
  );
  return a[idx];
}

export function checkWin(
  dots: Dot[],
  colorsCount: number,
  opts?: {
    dotR?: number;
    maxOutlierShare?: number;
    gap?: number;
    percentileP?: number;
  }
): boolean {
  const dotR = opts?.dotR ?? 8;
  const maxOutlierShare = opts?.maxOutlierShare ?? 0.08;
  const gap = opts?.gap ?? 2 * dotR + 10;
  const p = opts?.percentileP ?? 0.9;

  const groups: Dot[][] = Array.from({ length: colorsCount }, () => []);
  for (const d of dots) groups[d.c].push(d);

  const clusters = groups.map((g) => {
    const n = g.length || 1;
    const cx = g.reduce((s, d) => s + d.x, 0) / n;
    const cy = g.reduce((s, d) => s + d.y, 0) / n;

    const dists = g.map((d) => Math.hypot(d.x - cx, d.y - cy));
    const rP = percentile(dists, p);

    const targetR = dotR * (Math.sqrt(n) + 1.2);
    const maxClusterR = targetR * 1.15;

    const outliers = dists.filter((d) => d > maxClusterR).length;
    const allowedOutliers = Math.max(1, Math.floor(n * maxOutlierShare));

    return {
      cx,
      cy,
      rEff: Math.min(rP, maxClusterR),
      outliers,
      allowedOutliers,
      size: n,
    };
  });

  for (const c of clusters) {
    if (c.outliers > c.allowedOutliers) return false;
  }

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i],
        b = clusters[j];
      const dist = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      if (dist < a.rEff + b.rEff + gap) return false;
    }
  }

  return true;
}
