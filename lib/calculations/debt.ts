import type { Liability, DebtStrategy, DebtPayoffResult } from "@/lib/types";

export function computeDebtPayoff(
  liabilities: Liability[],
  strategy: DebtStrategy,
  extraMonthly: number
): DebtPayoffResult {
  let debts = liabilities.filter(l => l.value > 0).map(l => ({ ...l, remaining: l.value }));
  if (debts.length === 0) return { months: 0, totalInterest: 0, schedule: [] };

  if (strategy === "avalanche") debts.sort((a, b) => (b.rate || 0) - (a.rate || 0));
  else debts.sort((a, b) => a.remaining - b.remaining);

  const schedule: { month: number; remaining: number }[] = [];
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 600;

  while (debts.some(d => d.remaining > 0.01) && months < maxMonths) {
    months++;
    let extraLeft = extraMonthly;
    debts.forEach(d => {
      if (d.remaining <= 0) return;
      const interest = d.remaining * ((d.rate || 0) / 100 / 12);
      totalInterest += interest;
      let payment = (d.monthlyPayment || 0) + interest;
      if (extraLeft > 0 && debts.filter(x => x.remaining > 0)[0]?.id === d.id) {
        payment += extraLeft;
        extraLeft = 0;
      }
      d.remaining = Math.max(0, d.remaining - payment + interest);
    });
    if (months % 12 === 0 || !debts.some(d => d.remaining > 0.01)) {
      schedule.push({ month: months, remaining: debts.reduce((s, d) => s + d.remaining, 0) });
    }
  }

  return { months, totalInterest: Math.round(totalInterest), schedule };
}
