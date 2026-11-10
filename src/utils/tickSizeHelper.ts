export function roundToTickSize(price: number): number {
  if (price < 2) return Math.floor(price / 0.01) * 0.01;
  if (price < 5) return Math.floor(price / 0.02) * 0.02;
  if (price < 10) return Math.floor(price / 0.05) * 0.05;
  if (price < 25) return Math.floor(price / 0.10) * 0.10;
  if (price < 100) return Math.floor(price / 0.25) * 0.25;
  if (price < 200) return Math.floor(price / 0.50) * 0.50;
  return Math.floor(price / 1) * 1;
}
