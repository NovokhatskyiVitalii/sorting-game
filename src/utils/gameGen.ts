// utils/gameGen.ts
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
    maxClusterR?: number;
    maxOutliersPerColor?: number;
    extraGap?: number;
  }
) {
  const {
    maxClusterR = 60,
    maxOutliersPerColor = 1,
    extraGap = 40,
  } = opts ?? {};

  const groups: Dot[][] = Array.from({ length: colorsCount }, () => []);
  for (const d of dots) groups[d.c].push(d);

  const clusters = groups.map((g) => {
    const cx = g.reduce((s, d) => s + d.x, 0) / g.length;
    const cy = g.reduce((s, d) => s + d.y, 0) / g.length;
    const dists = g.map((d) => Math.hypot(d.x - cx, d.y - cy));
    const r90 = percentile(dists, 0.9);
    const hardR = Math.min(maxClusterR, Math.max(r90, 0));
    const outliers = dists.filter((d) => d > hardR).length;
    return { cx, cy, r: Math.min(r90, maxClusterR), outliers, size: g.length };
  });

  for (const c of clusters) {
    const allowed = Math.max(maxOutliersPerColor, Math.floor(c.size * 0.1));
    if (c.outliers > allowed) return false;
  }

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const ci = clusters[i],
        cj = clusters[j];
      const dist = Math.hypot(ci.cx - cj.cx, ci.cy - cj.cy);
      if (dist < ci.r + cj.r + extraGap) return false;
    }
  }
  return true;
}
