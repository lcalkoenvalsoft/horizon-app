import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { FinancialStore, BudgetItem, Investment, Asset, Liability, Goal, Profile } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 9);

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  profile: {
    id: "",
    countryCode: "GB",
    currencyCode: "GBP",
    currentAge: 37,
    retireSpend: 3000,
    lifeExpectancy: 90,
    inflationRate: 2.0,
    taxRate: 0,
  },
  budgetItems: [],
  investments: [],
  assets: [],
  liabilities: [],
  goals: [],
  actuals: {},
  netWorthHistory: [],

  setProfile: (p) => {
    set((s) => ({ profile: { ...s.profile, ...p } }));
    // Persist to Supabase
    const supabase = createClient();
    supabase.from("profiles").update(p).eq("id", get().profile.id).then();
  },

  setBudgetItems: (items) => set({ budgetItems: items }),

  addBudgetItem: (item) => {
    set((s) => ({ budgetItems: [...s.budgetItems, item] }));
    const supabase = createClient();
    supabase.from("budget_items").insert({
      id: item.id,
      user_id: get().profile.id,
      section: item.section,
      name: item.name,
      amount: item.amount,
      category: item.category,
    }).then();
  },

  updateBudgetItem: (id, updates) => {
    set((s) => ({
      budgetItems: s.budgetItems.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
    const supabase = createClient();
    supabase.from("budget_items").update(updates).eq("id", id).then();
  },

  deleteBudgetItem: (id) => {
    set((s) => ({ budgetItems: s.budgetItems.filter((i) => i.id !== id) }));
    const supabase = createClient();
    supabase.from("budget_items").delete().eq("id", id).then();
  },

  setInvestments: (items) => set({ investments: items }),

  addInvestment: (item) => {
    set((s) => ({ investments: [...s.investments, item] }));
    const supabase = createClient();
    supabase.from("investments").insert({
      id: item.id,
      user_id: get().profile.id,
      name: item.name,
      ticker: item.ticker,
      balance: item.balance,
      monthly_contribution: item.monthlyContribution,
      annual_return: item.annualReturn,
      type: item.type,
    }).then();
  },

  updateInvestment: (id, updates) => {
    set((s) => ({
      investments: s.investments.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
    const supabase = createClient();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.ticker !== undefined) dbUpdates.ticker = updates.ticker;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.monthlyContribution !== undefined) dbUpdates.monthly_contribution = updates.monthlyContribution;
    if (updates.annualReturn !== undefined) dbUpdates.annual_return = updates.annualReturn;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    supabase.from("investments").update(dbUpdates).eq("id", id).then();
  },

  deleteInvestment: (id) => {
    set((s) => ({ investments: s.investments.filter((i) => i.id !== id) }));
    const supabase = createClient();
    supabase.from("investments").delete().eq("id", id).then();
  },

  setAssets: (items) => set({ assets: items }),
  setLiabilities: (items) => set({ liabilities: items }),
  setGoals: (items) => set({ goals: items }),

  setActual: (month, category, amount) => {
    set((s) => ({
      actuals: {
        ...s.actuals,
        [month]: { ...(s.actuals[month] || {}), [category]: amount },
      },
    }));
    const supabase = createClient();
    supabase.from("actuals").upsert({
      user_id: get().profile.id,
      month,
      category,
      amount,
    }, { onConflict: "user_id,month,category" }).then();
  },

  addNetWorthSnapshot: (snapshot) => {
    set((s) => {
      const exists = s.netWorthHistory.find((h) => h.month === snapshot.month);
      if (exists) {
        return { netWorthHistory: s.netWorthHistory.map((h) => (h.month === snapshot.month ? snapshot : h)) };
      }
      return { netWorthHistory: [...s.netWorthHistory, snapshot].slice(-24) };
    });
    const supabase = createClient();
    supabase.from("net_worth_history").upsert({
      user_id: get().profile.id,
      month: snapshot.month,
      total_assets: snapshot.totalAssets,
      total_liabilities: snapshot.totalLiabilities,
      net_worth: snapshot.netWorth,
      portfolio_value: snapshot.portfolioValue,
    }, { onConflict: "user_id,month" }).then();
  },

  hydrate: (data) => set(data),
}));

// Load user data from Supabase on auth
export async function hydrateStore(userId: string) {
  const supabase = createClient();
  const store = useFinancialStore.getState();

  const [profileRes, budgetRes, investRes, assetRes, liabRes, goalRes, actualsRes, nwRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("budget_items").select("*").eq("user_id", userId).order("sort_order"),
    supabase.from("investments").select("*").eq("user_id", userId).order("sort_order"),
    supabase.from("assets").select("*").eq("user_id", userId),
    supabase.from("liabilities").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("actuals").select("*").eq("user_id", userId),
    supabase.from("net_worth_history").select("*").eq("user_id", userId).order("month"),
  ]);

  const profile = profileRes.data;
  const actuals: Record<string, Record<string, number>> = {};
  (actualsRes.data || []).forEach((a: { month: string; category: string; amount: number }) => {
    if (!actuals[a.month]) actuals[a.month] = {};
    actuals[a.month][a.category] = a.amount;
  });

  store.hydrate({
    profile: profile ? {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      countryCode: profile.country_code || "GB",
      currencyCode: profile.currency_code || "GBP",
      currentAge: profile.current_age || 37,
      retireSpend: profile.retire_spend || 3000,
      lifeExpectancy: profile.life_expectancy || 90,
      inflationRate: profile.inflation_rate || 2.0,
      taxRate: profile.tax_rate || 0,
    } : store.profile,
    budgetItems: (budgetRes.data || []).map((b: Record<string, unknown>) => ({
      id: b.id, section: b.section, name: b.name, amount: b.amount, category: b.category, sortOrder: b.sort_order,
    })) as BudgetItem[],
    investments: (investRes.data || []).map((i: Record<string, unknown>) => ({
      id: i.id, name: i.name, ticker: i.ticker || "", balance: i.balance || 0,
      monthlyContribution: i.monthly_contribution || 0, annualReturn: i.annual_return || 7,
      type: i.type || "stocks", sortOrder: i.sort_order,
    })) as Investment[],
    assets: (assetRes.data || []).map((a: Record<string, unknown>) => ({
      id: a.id, name: a.name, value: a.value || 0, category: a.category || "other",
    })) as Asset[],
    liabilities: (liabRes.data || []).map((l: Record<string, unknown>) => ({
      id: l.id, name: l.name, value: l.value || 0, monthlyPayment: l.monthly_payment || 0, rate: l.interest_rate || 0,
    })) as Liability[],
    goals: (goalRes.data || []).map((g: Record<string, unknown>) => ({
      id: g.id, name: g.name, icon: g.icon || "🎯", target: g.target || 0, saved: g.saved || 0, deadline: g.deadline || "",
    })) as Goal[],
    actuals,
    netWorthHistory: (nwRes.data || []).map((n: Record<string, unknown>) => ({
      month: n.month as string, totalAssets: n.total_assets as number, totalLiabilities: n.total_liabilities as number,
      netWorth: n.net_worth as number, portfolioValue: n.portfolio_value as number,
          })),
  });
}
