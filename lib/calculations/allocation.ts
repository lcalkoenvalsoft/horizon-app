import type { AllocationSegment } from "@/lib/types";

export interface AllocationInsight {
  type: "warning" | "info" | "good";
  icon: string;
  text: string;
}

export interface AllocationAnalysis {
  riskScore: number;
  riskLabel: string;
  diverseScore: number;
  diverseCount: number;
  suggestedStocks: number;
  suggestedBonds: number;
  insights: AllocationInsight[];
}

export function analyzeAllocation(segments: AllocationSegment[], age: number, inflationRate: number): AllocationAnalysis {
  const total = segments.reduce((s, t) => s + t.value, 0);
  if (total === 0) return { riskScore: 0, riskLabel: "N/A", diverseScore: 0, diverseCount: 0, suggestedStocks: 60, suggestedBonds: 40, insights: [] };

  const alloc = segments.map(t => ({ ...t, pct: (t.value / total) * 100 }));
  const getPct = (name: string) => alloc.find(a => a.name === name)?.pct || 0;

  const stocksPct = getPct("stocks");
  const bondsPct = getPct("bonds");
  const savingsPct = getPct("savings");
  const cryptoPct = getPct("crypto");
  const rePct = getPct("realestate");

  const riskScore = Math.min(100, Math.round(stocksPct * 0.7 + cryptoPct * 1.0 + rePct * 0.5 + bondsPct * 0.2 + savingsPct * 0.05));
  const riskLabel = riskScore > 70 ? "Aggressive" : riskScore > 45 ? "Moderate" : riskScore > 20 ? "Conservative" : "Very Conservative";

  const suggestedStocks = Math.max(20, Math.min(90, 110 - age));
  const suggestedBonds = 100 - suggestedStocks;
  const isOverweight = stocksPct > suggestedStocks + 15;
  const isUnderweight = stocksPct < suggestedStocks - 15;

  const maxPct = Math.max(...alloc.map(a => a.pct));
  const diverseCount = alloc.filter(a => a.pct > 5).length;
  const diverseScore = Math.min(100, diverseCount * 25);

  const insights: AllocationInsight[] = [];

  if (maxPct > 75) {
    const top = alloc.reduce((a, b) => a.pct! > b.pct! ? a : b);
    insights.push({ type: "warning", icon: "⚠", text: `High concentration: ${top.pct!.toFixed(0)}% in ${top.name}. Consider diversifying.` });
  }
  if (isOverweight) {
    insights.push({ type: "info", icon: "📊", text: `At age ${age}, your ${stocksPct.toFixed(0)}% equities is above the rule-of-thumb ${suggestedStocks}%. More aggressive — higher return potential but more volatility.` });
  } else if (isUnderweight) {
    insights.push({ type: "info", icon: "📊", text: `At age ${age}, your ${stocksPct.toFixed(0)}% equities is below the suggested ${suggestedStocks}%. You may be leaving growth on the table.` });
  } else {
    insights.push({ type: "good", icon: "✓", text: `Your ${stocksPct.toFixed(0)}% equities allocation is well-suited for age ${age}.` });
  }
  if (cryptoPct > 15) {
    insights.push({ type: "warning", icon: "⚡", text: `${cryptoPct.toFixed(0)}% in crypto is significant. Most advisors suggest capping at 5-10%.` });
  }
  if (savingsPct > 30 && age < 50) {
    insights.push({ type: "info", icon: "💡", text: `${savingsPct.toFixed(0)}% in savings is conservative for your age. Inflation (${inflationRate}%) may erode this.` });
  }
  if (bondsPct === 0 && age > 40) {
    insights.push({ type: "info", icon: "🛡️", text: `No bond allocation. Consider adding 10-${Math.round(100 - suggestedStocks)}% for stability.` });
  }
  if (diverseCount >= 4) {
    insights.push({ type: "good", icon: "✓", text: `Good diversification across ${diverseCount} asset classes.` });
  }
  if (diverseCount <= 2) {
    insights.push({ type: "warning", icon: "⚠", text: `Only ${diverseCount} asset classes. Diversifying reduces risk.` });
  }

  return { riskScore, riskLabel, diverseScore, diverseCount, suggestedStocks, suggestedBonds, insights };
}
