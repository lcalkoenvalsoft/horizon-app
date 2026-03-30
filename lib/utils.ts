// ═══════════════════════════════════════════════════════════════
// HORIZON — Utility Functions
// ═══════════════════════════════════════════════════════════════

export const uid = () => Math.random().toString(36).slice(2, 9);

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function fmt(n: number | null | undefined, sym = "€"): string {
  if (n === undefined || n === null || isNaN(n)) return `${sym}0`;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${sym}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
}

export function fmtFull(n: number | null | undefined, sym = "€"): string {
  return `${sym}${(n || 0).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function monthLabel(m: string): string {
  const [y, mo] = m.split("-");
  return `${MONTHS[parseInt(mo, 10) - 1]} ${y}`;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
