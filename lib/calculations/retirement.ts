// ═══════════════════════════════════════════════════════════════
// HORIZON — Retirement & FIRE Calculation Engines
// ═══════════════════════════════════════════════════════════════

import type { Profile, Investment, RetirementProjection, FireResults } from "@/lib/types";

interface RetirementParams {
  profile: Profile;
  totalPortfolioBalance: number;
  totalInvestmentContribution: number;
  weightedReturn: number;
}

export function computeRetirementProjection(params: RetirementParams): RetirementProjection {
  const { profile, totalPortfolioBalance, totalInvestmentContribution, weightedReturn } = params;
  const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
  const monthlyReturn = weightedReturn / 100 / 12;
  const data = [];
  let bal = totalPortfolioBalance;
  const monthlyContrib = totalInvestmentContribution;
  const yearsToProject = Math.max(lifeExpectancy - currentAge + 5, 40);
  let retireAge: number | null = null;

  for (let y = 0; y <= yearsToProject; y++) {
    const age = currentAge + y;
    const futureMonthlySpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
    const annualSpend = (futureMonthlySpend * 12) / (1 - taxRate / 100);
    const requiredNestEgg = annualSpend / 0.04;

    data.push({ age, value: Math.round(bal), required: Math.round(requiredNestEgg) });

    if (bal >= requiredNestEgg && retireAge === null && age > currentAge) {
      retireAge = age;
    }

    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + monthlyReturn) + monthlyContrib;
    }
  }

  return {
    data,
    retireAge: retireAge || lifeExpectancy,
    yearsToRetire: retireAge ? retireAge - currentAge : null,
  };
}

export function computeRetireAge(params: RetirementParams & { monthlyContrib: number }): number {
  const { profile, totalPortfolioBalance, weightedReturn, monthlyContrib } = params;
  const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
  const mr = weightedReturn / 100 / 12;
  let bal = totalPortfolioBalance;

  for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
    const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
    const annual = (futureSpend * 12) / (1 - taxRate / 100);
    if (bal >= annual / 0.04 && y > 0) return currentAge + y;
    for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + monthlyContrib;
  }
  return lifeExpectancy;
}

export function computeRetireAgeOneTime(params: RetirementParams & { lumpSum: number }): number {
  const { profile, totalPortfolioBalance, totalInvestmentContribution, weightedReturn, lumpSum } = params;
  const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
  const mr = weightedReturn / 100 / 12;
  let bal = totalPortfolioBalance + lumpSum;

  for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
    const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
    const annual = (futureSpend * 12) / (1 - taxRate / 100);
    if (bal >= annual / 0.04 && y > 0) return currentAge + y;
    for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + totalInvestmentContribution;
  }
  return lifeExpectancy;
}

export function computeRetireAgeWithSpend(params: RetirementParams & { spend: number }): number {
  const { profile, totalPortfolioBalance, totalInvestmentContribution, weightedReturn, spend } = params;
  const { currentAge, lifeExpectancy, inflationRate, taxRate } = profile;
  const mr = weightedReturn / 100 / 12;
  let bal = totalPortfolioBalance;

  for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
    const futureSpend = spend * Math.pow(1 + inflationRate / 100, y);
    const annual = (futureSpend * 12) / (1 - taxRate / 100);
    if (bal >= annual / 0.04 && y > 0) return currentAge + y;
    for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + totalInvestmentContribution;
  }
  return lifeExpectancy;
}

export function computeFireVariants(params: RetirementParams & {
  baristaIncome: number;
  leanSpend: number;
  fatSpend: number;
  projection: RetirementProjection;
}): FireResults {
  const { profile, totalPortfolioBalance, totalInvestmentContribution, weightedReturn, baristaIncome, leanSpend, fatSpend, projection } = params;
  const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
  const mr = weightedReturn / 100 / 12;

  // Traditional
  const traditional = { age: projection.retireAge, years: projection.yearsToRetire };

  // Coast FIRE
  let coastBal = totalPortfolioBalance;
  let coastAge: number | null = null;
  for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
    const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
    const required = (futureSpend * 12 / (1 - taxRate / 100)) / 0.04;
    if (coastBal >= required && y > 0) { coastAge = currentAge + y; break; }
    for (let m = 0; m < 12; m++) coastBal *= (1 + mr);
  }

  // Barista FIRE
  let baristaBal = totalPortfolioBalance;
  let baristaAge: number | null = null;
  for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
    const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
    const gap = Math.max(0, futureSpend - baristaIncome);
    const required = (gap * 12 / (1 - taxRate / 100)) / 0.04;
    if (baristaBal >= required && y > 0) { baristaAge = currentAge + y; break; }
    for (let m = 0; m < 12; m++) baristaBal = baristaBal * (1 + mr) + totalInvestmentContribution;
  }

  return {
    traditional,
    coast: { age: coastAge || lifeExpectancy, canCoast: coastAge !== null },
    barista: { age: baristaAge || lifeExpectancy, income: baristaIncome },
    lean: { age: computeRetireAgeWithSpend({ ...params, spend: leanSpend }), spend: leanSpend },
    fat: { age: computeRetireAgeWithSpend({ ...params, spend: fatSpend }), spend: fatSpend },
  };
}
