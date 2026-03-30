// ═══════════════════════════════════════════════════════════════
// HORIZON — Type Definitions
// ═══════════════════════════════════════════════════════════════

export type BudgetSection = "income" | "expense";
export type ExpenseCategory = "housing" | "essentials" | "lifestyle" | "savings";
export type InvestmentType = "stocks" | "bonds" | "crypto" | "realestate" | "savings" | "other";
export type AssetCategory = "property" | "vehicle" | "cash" | "other";
export type DebtStrategy = "avalanche" | "snowball";
export type FireMode = "traditional" | "coast" | "barista" | "lean" | "fat";
export type BoostMode = "recurring" | "onetime" | "theoretical";

export interface Profile {
  id: string;
  email?: string;
  fullName?: string;
  countryCode: string;
  currencyCode: string;
  currentAge: number;
  retireSpend: number;
  lifeExpectancy: number;
  inflationRate: number;
  taxRate: number;
}

export interface BudgetItem {
  id: string;
  userId?: string;
  section: BudgetSection;
  name: string;
  amount: number;
  category?: ExpenseCategory;
  sortOrder?: number;
}

export interface Investment {
  id: string;
  userId?: string;
  name: string;
  ticker: string;
  balance: number;
  monthlyContribution: number;
  annualReturn: number;
  type: InvestmentType;
  sortOrder?: number;
}

export interface Asset {
  id: string;
  userId?: string;
  name: string;
  value: number;
  category: AssetCategory;
}

export interface Liability {
  id: string;
  userId?: string;
  name: string;
  value: number;
  monthlyPayment: number;
  rate: number;
}

export interface Goal {
  id: string;
  userId?: string;
  name: string;
  icon: string;
  target: number;
  saved: number;
  deadline: string;
  linkedInvestmentId?: string;
}

export interface Actual {
  id: string;
  userId?: string;
  month: string; // YYYY-MM
  category: ExpenseCategory | "income";
  amount: number;
}

export interface Transaction {
  id: string;
  userId?: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory | "income";
  source: "manual" | "upload" | "bank_sync";
}

export interface NetWorthSnapshot {
  month: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  portfolioValue: number;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  inflation: number;
  capitalGainsTax: number;
  withdrawalTax: number;
  retireAge: number;
  lifeExpect: number;
  vatRate: number;
  pensionSystem: string;
  notes: string;
}

export interface Currency {
  code: string;
  symbol: string;
  locale: string;
}

export interface ProjectionPoint {
  age: number;
  value: number;
  required: number;
}

export interface RetirementProjection {
  data: ProjectionPoint[];
  retireAge: number;
  yearsToRetire: number | null;
}

export interface FireResults {
  traditional: { age: number; years: number | null };
  coast: { age: number; canCoast: boolean };
  barista: { age: number; income: number };
  lean: { age: number; spend: number };
  fat: { age: number; spend: number };
}

export interface DebtPayoffResult {
  months: number;
  totalInterest: number;
  schedule: { month: number; remaining: number }[];
}

export interface AllocationSegment {
  name: string;
  value: number;
  color: string;
  pct?: number;
}

export interface AssetData {
  name: string;
  ticker: string;
  assetType: string;
  exchange: string;
  currency: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePct: number;
  high52w: number;
  low52w: number;
  marketCap: string | null;
  peRatio: number | null;
  dividendYield: number | null;
  expenseRatio: number | null;
  beta: number | null;
  volume: string;
  avgVolume: string | null;
  sector: string | null;
  industry: string | null;
  description: string;
  ytdReturn: number | null;
  return1y: number | null;
  return3y: number | null;
  return5y: number | null;
  holdings: string | null;
  monthlyPrices: number[];
}

export interface CountryInsights {
  inflationForecast3y: number | null;
  inflationForecast5y: number | null;
  centralBankRate: number | null;
  avgSavingsRate: number | null;
  avgMortgageRate: number | null;
  stockMarketYTD: number | null;
  realEstateGrowth1y: number | null;
  retirementAgeOfficial: number;
  retirementAgeTrend: "rising" | "stable" | "falling";
  taxTips: string;
  bestRetirementAccounts: string;
  socialSecurityMonthly: number | null;
  costOfLivingIndex: number | null;
  headline: string;
}

// ─── Zustand Store Shape ─────────────────────────────────────
export interface FinancialStore {
  profile: Profile;
  budgetItems: BudgetItem[];
  investments: Investment[];
  assets: Asset[];
  liabilities: Liability[];
  goals: Goal[];
  actuals: Record<string, Record<string, number>>; // { "2026-03": { housing: 1200 } }
  netWorthHistory: NetWorthSnapshot[];

  // Actions
  setProfile: (p: Partial<Profile>) => void;
  setBudgetItems: (items: BudgetItem[]) => void;
  addBudgetItem: (item: BudgetItem) => void;
  updateBudgetItem: (id: string, updates: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;
  setInvestments: (items: Investment[]) => void;
  addInvestment: (item: Investment) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  setAssets: (items: Asset[]) => void;
  setLiabilities: (items: Liability[]) => void;
  setGoals: (items: Goal[]) => void;
  setActual: (month: string, category: string, amount: number) => void;
  addNetWorthSnapshot: (snapshot: NetWorthSnapshot) => void;
  hydrate: (data: Partial<FinancialStore>) => void;
}
