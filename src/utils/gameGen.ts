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

function allowedOutliersForSize(size: number) {
  if (size <= 10) return 0;
  return Math.min(3, Math.floor(size * 0.06));
}

export function checkWin(
  dots: Dot[],
  colorsCount: number,
  opts?: {
    maxClusterR?: number;
    extraGap?: number;
    minPairSumR?: number;
    hardFarAllowance?: number;
    minGroupSize?: number;
    dotR?: number;
  }
): boolean {
  const {
    maxClusterR = 80,
    extraGap = 24,
    minPairSumR = 36,
    hardFarAllowance = 6,
    minGroupSize = 4,
  } = opts ?? {};

  if (!dots.length || colorsCount <= 0) return false;

  const perColor = dots.length / colorsCount;

  const adaptiveR = perColor <= 6 ? 45 : perColor <= 12 ? 65 : maxClusterR;
  const adaptiveMinGroup = Math.max(2, Math.min(minGroupSize, perColor));
  const adaptiveGap = perColor <= 5 ? 18 : extraGap;

  const groups: Dot[][] = Array.from({ length: colorsCount }, () => []);
  for (const d of dots) {
    if (d.c >= 0 && d.c < colorsCount) groups[d.c].push(d);
  }

  for (const g of groups) {
    if (!g || g.length < adaptiveMinGroup) return false;
  }

  const clusters = groups.map((g) => {
    const size = g.length;
    const cx = g.reduce((s, d) => s + d.x, 0) / size;
    const cy = g.reduce((s, d) => s + d.y, 0) / size;
    const dists = g.map((d) => Math.hypot(d.x - cx, d.y - cy));
    const r90 = percentile(dists, 0.9);
    const rEff = Math.min(r90, adaptiveR);
    const maxD = Math.max(...dists);
    const outliers = dists.filter((d) => d > adaptiveR).length;
    return { cx, cy, rEff, outliers, size, maxD };
  });

  for (const c of clusters) {
    const allowed = allowedOutliersForSize(c.size);
    if (c.outliers > allowed) return false;
    if (c.maxD > adaptiveR + hardFarAllowance) return false;
  }

  const allXs = clusters.map((c) => c.cx);
  const allYs = clusters.map((c) => c.cy);
  const spanX = Math.max(...allXs) - Math.min(...allXs);
  const spanY = Math.max(...allYs) - Math.min(...allYs);

  if (Math.hypot(spanX, spanY) < adaptiveR * 2.0) return false;

  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i],
        b = clusters[j];
      const dist = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      const sumR =
        Math.max(minPairSumR, a.rEff) + Math.max(minPairSumR, b.rEff);
      if (dist < sumR + adaptiveGap) return false;
    }
  }

  return true;
}
