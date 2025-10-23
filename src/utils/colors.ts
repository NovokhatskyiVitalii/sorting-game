export const PALETTES = [
  ["#FACC15", "#22D3EE", "#E879F9", "#60A5FA", "#FCA5A5", "#34D399"],
];

export const getPalette = (n: number) => {
  const base = PALETTES[0];
  if (n <= base.length) return base.slice(0, n);
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
};
