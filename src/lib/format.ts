/** Format milliliters as liters with 2 decimal places, pt-BR style (e.g. "2,25 L"). */
export function formatLiters(ml: number, suffix: string = " L"): string {
  return (ml / 1000).toFixed(2).replace(".", ",") + suffix;
}

/** Compact volume: ml below 1L, formatted liters at 2 decimals otherwise. */
export function formatVolume(ml: number): string {
  if (ml < 1000) return `${Math.round(ml)} ml`;
  return formatLiters(ml);
}

/** Numeric part only (without unit suffix) for split rendering. */
export function literValue(ml: number): string {
  return (ml / 1000).toFixed(2).replace(".", ",");
}
