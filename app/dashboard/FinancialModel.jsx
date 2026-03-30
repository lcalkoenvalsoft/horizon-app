import { useState, useEffect, useMemo, useCallback } from "react";

// ─── Constants & Helpers ───────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CURRENCIES = [
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "CHF", symbol: "Fr.", locale: "de-CH" },
  { code: "JPY", symbol: "¥", locale: "ja-JP" },
  { code: "CAD", symbol: "C$", locale: "en-CA" },
  { code: "AUD", symbol: "A$", locale: "en-AU" },
  { code: "SEK", symbol: "kr", locale: "sv-SE" },
  { code: "NOK", symbol: "kr", locale: "nb-NO" },
  { code: "DKK", symbol: "kr", locale: "da-DK" },
  { code: "PLN", symbol: "zł", locale: "pl-PL" },
  { code: "INR", symbol: "₹", locale: "en-IN" },
  { code: "BRL", symbol: "R$", locale: "pt-BR" },
  { code: "CNY", symbol: "¥", locale: "zh-CN" },
  { code: "KRW", symbol: "₩", locale: "ko-KR" },
];

const fmt = (n, sym = "€") => {
  if (n === undefined || n === null || isNaN(n)) return `${sym}0`;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${sym}${(abs/1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${sym}${Math.round(abs).toLocaleString("en")}`;
  return `${sign}${sym}${abs.toFixed(0)}`;
};

// Abbreviated format for chart axes
const fmtShort = (n, sym = "€") => {
  if (n === undefined || n === null || isNaN(n)) return `${sym}0`;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${sym}${(abs/1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${sym}${(abs/1_000).toFixed(0)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
};

const fmtFull = (n, sym = "€") => {
  if (n === undefined || n === null || isNaN(n)) return `${sym}0`;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  return `${sign}${sym}${Math.round(abs).toLocaleString("en")}`;
};

const uid = () => Math.random().toString(36).slice(2,9);

const DEFAULT_BUDGET_ITEMS = {
  income: [
    { id: uid(), name: "Salary (net)", amount: 4500 },
    { id: uid(), name: "Side income", amount: 0 },
  ],
  expenses: [
    { id: uid(), name: "Rent / Mortgage", amount: 1200, category: "housing" },
    { id: uid(), name: "Utilities", amount: 150, category: "housing" },
    { id: uid(), name: "Groceries", amount: 400, category: "essentials" },
    { id: uid(), name: "Transport", amount: 120, category: "essentials" },
    { id: uid(), name: "Insurance", amount: 200, category: "essentials" },
    { id: uid(), name: "Subscriptions", amount: 60, category: "lifestyle" },
    { id: uid(), name: "Dining out", amount: 200, category: "lifestyle" },
    { id: uid(), name: "Entertainment", amount: 100, category: "lifestyle" },
    { id: uid(), name: "Clothing", amount: 80, category: "lifestyle" },
    { id: uid(), name: "Savings / Investing", amount: 800, category: "savings" },
  ],
};

const DEFAULT_INVESTMENTS = [
  { id: uid(), name: "Global Index Fund (ETF)", ticker: "VWRL.AS", balance: 25000, monthlyContribution: 500, annualReturn: 7.0, type: "stocks", account: "isa" },
  { id: uid(), name: "Bond Fund", ticker: "AGGH.L", balance: 10000, monthlyContribution: 200, annualReturn: 4.0, type: "bonds", account: "isa" },
  { id: uid(), name: "Emergency Fund (Savings)", ticker: "", balance: 8000, monthlyContribution: 100, annualReturn: 2.5, type: "savings", account: "bank" },
];

const DEFAULT_ACCOUNTS = [
  { id: "isa", name: "ISA / Tax-Advantaged", icon: "🛡️", color: "#7CCA98" },
  { id: "bank", name: "Personal Bank Account", icon: "🏦", color: "#5B8DEF" },
  { id: "crypto_wallet", name: "Crypto Wallet / Exchange", icon: "₿", color: "#F0C75E" },
  { id: "pension", name: "Pension Fund", icon: "🏛️", color: "#C09BD8" },
  { id: "brokerage", name: "Brokerage Account", icon: "📈", color: "#E8927C" },
  { id: "other", name: "Other", icon: "📁", color: "#7CAABD" },
];

const CATEGORY_COLORS = {
  housing: "#E8927C",
  essentials: "#7CAABD",
  lifestyle: "#C09BD8",
  savings: "#7CCA98",
};

const INVESTMENT_COLORS = {
  stocks: "#5B8DEF",
  bonds: "#E8927C",
  crypto: "#F0C75E",
  realestate: "#7CCA98",
  savings: "#C09BD8",
  other: "#7CAABD",
};

const COUNTRIES = [
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR", inflation: 2.7, capitalGainsTax: 32, withdrawalTax: 0, retireAge: 67, lifeExpect: 82, vatRate: 21, pensionSystem: "State pension (AOW) + occupational pension", notes: "Box 3 wealth tax applies; deemed return taxed at ~32%" },
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", inflation: 3.2, capitalGainsTax: 15, withdrawalTax: 22, retireAge: 67, lifeExpect: 79, vatRate: 0, pensionSystem: "Social Security + 401(k)/IRA", notes: "Traditional 401(k) withdrawals taxed as income; Roth tax-free" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", inflation: 3.4, capitalGainsTax: 20, withdrawalTax: 20, retireAge: 66, lifeExpect: 81, vatRate: 20, pensionSystem: "State Pension + workplace pension", notes: "25% tax-free lump sum; ISA wrappers fully tax-free" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", inflation: 2.5, capitalGainsTax: 26.4, withdrawalTax: 25, retireAge: 67, lifeExpect: 81, vatRate: 19, pensionSystem: "Gesetzliche Rente + Riester/Rürup", notes: "Abgeltungsteuer (flat 26.4% on investment income)" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", inflation: 2.3, capitalGainsTax: 30, withdrawalTax: 30, retireAge: 64, lifeExpect: 83, vatRate: 20, pensionSystem: "Régime général + supplementary", notes: "PFU flat tax 30% on investment income; PEA wrapper tax-advantaged" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", currency: "CHF", inflation: 1.4, capitalGainsTax: 0, withdrawalTax: 10, retireAge: 65, lifeExpect: 84, vatRate: 8.1, pensionSystem: "Three-pillar system (AHV + BVG + 3a)", notes: "No capital gains tax for private investors; wealth tax applies" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", currency: "SEK", inflation: 2.1, capitalGainsTax: 30, withdrawalTax: 30, retireAge: 66, lifeExpect: 83, vatRate: 25, pensionSystem: "Allmän pension + tjänstepension", notes: "ISK accounts taxed on deemed return; very favorable" },
  { code: "NO", name: "Norway", flag: "🇳🇴", currency: "NOK", inflation: 3.0, capitalGainsTax: 22, withdrawalTax: 22, retireAge: 67, lifeExpect: 83, vatRate: 25, pensionSystem: "Folketrygden + AFP + occupational", notes: "ASK account tax-deferred; shielding deduction available" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", currency: "DKK", inflation: 2.2, capitalGainsTax: 27, withdrawalTax: 37, retireAge: 67, lifeExpect: 81, vatRate: 25, pensionSystem: "Folkepension + ATP + occupational", notes: "27% on gains <≈€8K, 42% above; pension taxed as income" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", currency: "EUR", inflation: 2.8, capitalGainsTax: 0, withdrawalTax: 30, retireAge: 65, lifeExpect: 82, vatRate: 21, pensionSystem: "Legal pension + occupational + individual", notes: "No capital gains tax on stocks held >1yr; roerende voorheffing 30%" },
  { code: "ES", name: "Spain", flag: "🇪🇸", currency: "EUR", inflation: 3.1, capitalGainsTax: 23, withdrawalTax: 23, retireAge: 66, lifeExpect: 84, vatRate: 21, pensionSystem: "Seguridad Social + planes de pensiones", notes: "Savings income taxed 19-28% progressive" },
  { code: "IT", name: "Italy", flag: "🇮🇹", currency: "EUR", inflation: 2.4, capitalGainsTax: 26, withdrawalTax: 26, retireAge: 67, lifeExpect: 83, vatRate: 22, pensionSystem: "INPS + fondi pensione", notes: "26% substitute tax on financial income; govt bonds at 12.5%" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", currency: "EUR", inflation: 2.6, capitalGainsTax: 28, withdrawalTax: 28, retireAge: 66, lifeExpect: 82, vatRate: 23, pensionSystem: "Segurança Social + PPR", notes: "NHR regime may offer 10yr tax benefits for new residents" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", currency: "EUR", inflation: 2.5, capitalGainsTax: 33, withdrawalTax: 0, retireAge: 66, lifeExpect: 82, vatRate: 23, pensionSystem: "State Pension + occupational + PRSA", notes: "CGT 33%; deemed disposal every 8yr on ETFs (41%)" },
  { code: "AT", name: "Austria", flag: "🇦🇹", currency: "EUR", inflation: 2.9, capitalGainsTax: 27.5, withdrawalTax: 27.5, retireAge: 65, lifeExpect: 82, vatRate: 20, pensionSystem: "Gesetzliche Pension + betriebliche", notes: "KESt 27.5% on capital income" },
  { code: "PL", name: "Poland", flag: "🇵🇱", currency: "PLN", inflation: 4.2, capitalGainsTax: 19, withdrawalTax: 19, retireAge: 65, lifeExpect: 78, vatRate: 23, pensionSystem: "ZUS + OFE + IKE/IKZE", notes: "Flat 19% Belka tax on investment income; IKE/IKZE tax-advantaged" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", inflation: 2.8, capitalGainsTax: 25, withdrawalTax: 20, retireAge: 65, lifeExpect: 82, vatRate: 5, pensionSystem: "CPP/QPP + OAS + RRSP/TFSA", notes: "50% capital gains inclusion (66.7% above $250K); TFSA tax-free" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", inflation: 3.5, capitalGainsTax: 23, withdrawalTax: 0, retireAge: 67, lifeExpect: 83, vatRate: 10, pensionSystem: "Age Pension + Superannuation", notes: "Super taxed at 15% accumulation; 0% in pension phase after 60" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", inflation: 2.8, capitalGainsTax: 20, withdrawalTax: 20, retireAge: 65, lifeExpect: 85, vatRate: 10, pensionSystem: "Kokumin Nenkin + Kosei Nenkin + iDeCo/NISA", notes: "NISA accounts tax-free; new NISA expanded 2024" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", currency: "KRW", inflation: 2.5, capitalGainsTax: 22, withdrawalTax: 15, retireAge: 65, lifeExpect: 84, vatRate: 10, pensionSystem: "National Pension + IRP + ISA", notes: "Financial income >₩20M taxed progressively" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "USD", inflation: 3.0, capitalGainsTax: 0, withdrawalTax: 0, retireAge: 63, lifeExpect: 84, vatRate: 9, pensionSystem: "CPF (Central Provident Fund)", notes: "No capital gains tax; no dividend tax; CPF mandatory savings" },
  { code: "AE", name: "UAE", flag: "🇦🇪", currency: "USD", inflation: 2.3, capitalGainsTax: 0, withdrawalTax: 0, retireAge: 60, lifeExpect: 78, vatRate: 5, pensionSystem: "GPSSA (nationals) / Gratuity (expats)", notes: "No income tax; no capital gains tax; end-of-service gratuity" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", inflation: 5.0, capitalGainsTax: 12.5, withdrawalTax: 30, retireAge: 60, lifeExpect: 70, vatRate: 18, pensionSystem: "EPF + NPS + PPF", notes: "LTCG >₹1.25L taxed 12.5%; new tax regime simplified" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", inflation: 4.5, capitalGainsTax: 15, withdrawalTax: 15, retireAge: 65, lifeExpect: 76, vatRate: 20, pensionSystem: "INSS + private previdência", notes: "Progressive CGT 15-22.5%; PGBL/VGBL pension plans" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "USD", inflation: 4.0, capitalGainsTax: 10, withdrawalTax: 30, retireAge: 65, lifeExpect: 75, vatRate: 16, pensionSystem: "IMSS + Afores", notes: "10% CGT for residents; Afores mandatory retirement savings" },
];

const UPLOAD_PROMPT = `Extract financial data from this document. Return ONLY a JSON object (no markdown, no backticks, no preamble) with this structure:
{
  "summary": "1 sentence describing what was imported",
  "income": [{"name": "source name", "amount": monthly_number}] or [],
  "expenses": [{"name": "expense name", "amount": monthly_number, "category": "housing"|"essentials"|"lifestyle"|"savings"}] or [],
  "investments": [{"name": "investment name", "ticker": "TICKER or empty string", "balance": current_value_number, "monthlyContribution": monthly_number, "annualReturn": expected_percent_number, "type": "stocks"|"bonds"|"crypto"|"realestate"|"savings"|"other"}] or []
}
Extract whatever data is present. If the document only has budget data, leave investments empty and vice versa. Convert any annual amounts to monthly. Use reasonable defaults for missing fields. All amounts should be numbers, not strings.`;

// ─── Mini Chart Components ────────────────────────────────────────
function MiniBar({ data, max, color, height = 60 }) {
  const barW = Math.max(2, Math.floor(200 / data.length) - 2);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${data.length * (barW + 2)} ${height}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = max > 0 ? (v / max) * (height - 4) : 0;
        return <rect key={i} x={i * (barW + 2)} y={height - h - 2} width={barW} height={h} rx={1} fill={color} opacity={0.8 + (i / data.length) * 0.2} />;
      })}
    </svg>
  );
}

function DonutChart({ segments, size = 140, sym = "€" }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.38, stroke = size * 0.14;
  let cumAngle = -90;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.filter(s => s.value > 0).map((seg, i) => {
        const pct = seg.value / total;
        const angle = pct * 360;
        const startAngle = cumAngle;
        cumAngle += angle;
        const large = angle > 180 ? 1 : 0;
        const toRad = (a) => (a * Math.PI) / 180;
        const x1 = cx + r * Math.cos(toRad(startAngle));
        const y1 = cy + r * Math.sin(toRad(startAngle));
        const x2 = cx + r * Math.cos(toRad(startAngle + angle - 0.5));
        const y2 = cy + r * Math.sin(toRad(startAngle + angle - 0.5));
        return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={seg.color} strokeWidth={stroke} strokeLinecap="round" />;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize={size * 0.13} fontWeight="700" fontFamily="'DM Sans', sans-serif">{fmtFull(total, sym)}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize={size * 0.075} fontFamily="'DM Sans', sans-serif">/ month</text>
    </svg>
  );
}

function ProjectionChart({ data, retireAge, height = 220, sym = "€" }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value));
  const w = 600, h = height, pad = { t: 20, r: 20, b: 35, l: 55 };
  const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  const xScale = (i) => pad.l + (i / (data.length - 1)) * plotW;
  const yScale = (v) => pad.t + plotH - (v / maxVal) * plotH;

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(d.value).toFixed(1)}`).join(" ");
  const areaD = pathD + ` L ${xScale(data.length - 1).toFixed(1)} ${(pad.t + plotH).toFixed(1)} L ${pad.l} ${(pad.t + plotH).toFixed(1)} Z`;

  const retireIdx = data.findIndex(d => d.age >= retireAge);
  const retireX = retireIdx >= 0 ? xScale(retireIdx) : null;

  const yTicks = Array.from({ length: 5 }, (_, i) => (maxVal / 4) * i);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B8DEF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5B8DEF" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} y1={yScale(v)} x2={w - pad.r} y2={yScale(v)} stroke="var(--border)" strokeDasharray="3,3" />
          <text x={pad.l - 8} y={yScale(v) + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10" fontFamily="'DM Mono', monospace">{fmtShort(v, sym)}</text>
        </g>
      ))}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0).map((d, i) => (
        <text key={i} x={xScale(data.indexOf(d))} y={h - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="'DM Mono', monospace">{d.age}</text>
      ))}
      <path d={areaD} fill="url(#projGrad)" />
      <path d={pathD} fill="none" stroke="#5B8DEF" strokeWidth="2.5" strokeLinejoin="round" />
      {retireX && (
        <>
          <line x1={retireX} y1={pad.t} x2={retireX} y2={pad.t + plotH} stroke="#7CCA98" strokeWidth="2" strokeDasharray="6,4" />
          <rect x={retireX - 40} y={pad.t - 2} width={80} height={20} rx={4} fill="#7CCA98" />
          <text x={retireX} y={pad.t + 12} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600" fontFamily="'DM Sans', sans-serif">Retire @ {retireAge}</text>
        </>
      )}
    </svg>
  );
}

// ─── Editable Row Component ───────────────────────────────────────
function EditableRow({ item, onChange, onDelete, colorKey, colorMap }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
      {colorKey && colorMap && <div style={{ width: 10, height: 10, borderRadius: "50%", background: colorMap[item[colorKey]] || "#888", flexShrink: 0 }} />}
      <input
        type="text" value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 0 }}
      />
      <input
        type="number" value={item.amount || item.monthlyContribution || 0}
        onChange={(e) => {
          const key = "amount" in item ? "amount" : "monthlyContribution";
          onChange({ ...item, [key]: parseFloat(e.target.value) || 0 });
        }}
        style={{ width: 80, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace", textAlign: "right" }}
      />
      <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>×</button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function FinancialModel() {
  const [viewMode, setViewMode] = useState("simple"); // "simple" | "advanced"
  const [tab, setTab] = useState("dashboard");
  const [budget, setBudget] = useState(DEFAULT_BUDGET_ITEMS);
  const [investments, setInvestments] = useState(DEFAULT_INVESTMENTS);
  const [profile, setProfile] = useState({ currentAge: 30, retireSpend: 3000, lifeExpectancy: 90, inflationRate: 2.0, taxRate: 0 });

  // Simple mode inputs
  const [simpleInvested, setSimpleInvested] = useState(43000);
  const [simpleCash, setSimpleCash] = useState(5000);
  const [simpleAge, setSimpleAge] = useState(30);
  const [simpleRetireAge, setSimpleRetireAge] = useState(60);
  const [simpleMonthlyContrib, setSimpleMonthlyContrib] = useState(800);
  const [simpleFreedomAmount, setSimpleFreedomAmount] = useState("");
  const [simpleFreedomMode, setSimpleFreedomMode] = useState("monthly"); // "monthly" | "onetime"
  const [currencyCode, setCurrencyCode] = useState("EUR");
  const [assetView, setAssetView] = useState(null); // { ticker, investmentId }
  const [assetData, setAssetData] = useState(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState(null);
  const [boostAmount, setBoostAmount] = useState("");
  const [boostAdded, setBoostAdded] = useState(false);
  const [boostMode, setBoostMode] = useState("recurring"); // "recurring" | "onetime" | "theoretical"
  const [boostTarget, setBoostTarget] = useState("proportional"); // "proportional" | investment id
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploadParsing, setUploadParsing] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [countryCode, setCountryCode] = useState("NL");
  const [countryApplied, setCountryApplied] = useState(false);
  const [countryInsights, setCountryInsights] = useState(null);
  const [countryInsightsLoading, setCountryInsightsLoading] = useState(false);
  const [actuals, setActuals] = useState({}); // { "2026-03": { housing: 1180, essentials: 690, lifestyle: 420, savings: 800 }, ... }
  const [actualsMonth, setActualsMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [actualsExpanded, setActualsExpanded] = useState(null); // category key or null
  const [actualsUploading, setActualsUploading] = useState(false);

  // Net Worth
  const [assets, setAssets] = useState([
    { id: uid(), name: "Primary Residence", value: 320000, category: "property" },
    { id: uid(), name: "Car", value: 15000, category: "vehicle" },
    { id: uid(), name: "Checking Account", value: 5000, category: "cash" },
  ]);
  const [liabilities, setLiabilities] = useState([
    { id: uid(), name: "Mortgage", value: 240000, monthlyPayment: 1200, rate: 3.5 },
    { id: uid(), name: "Student Loan", value: 12000, monthlyPayment: 200, rate: 2.0 },
  ]);
  const [nwHistory, setNwHistory] = useState([]);

  // Goals
  const [goals, setGoals] = useState([
    { id: uid(), name: "Emergency Fund", target: 15000, saved: 8000, deadline: "2026-12", icon: "🛡️" },
    { id: uid(), name: "House Deposit", target: 50000, saved: 12000, deadline: "2028-06", icon: "🏠" },
  ]);

  // Debt strategy
  const [debtStrategy, setDebtStrategy] = useState("avalanche");
  const [debtExtra, setDebtExtra] = useState(0);

  // FIRE mode
  const [fireMode, setFireMode] = useState("traditional");
  const [baristaIncome, setBaristaIncome] = useState(1500);
  const [leanSpend, setLeanSpend] = useState(2000);
  const [fatSpend, setFatSpend] = useState(5000);

  // Investment accounts / locations
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);

  // Drag-and-drop reorder state
  const [dragState, setDragState] = useState({ dragging: null, over: null, list: null }); // { dragging: id, over: id, list: "investments"|"income"|"expenses"|"assets"|"liabilities"|"goals"|"accounts" }

  // Generic drag-reorder handler
  const makeDragHandlers = useCallback((listKey, items, setItems) => ({
    onDragStart: (e, id) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      setDragState({ dragging: id, over: null, list: listKey });
    },
    onDragOver: (e, id) => {
      e.preventDefault();
      if (dragState.list === listKey) setDragState(prev => ({ ...prev, over: id }));
    },
    onDragEnd: () => {
      if (dragState.dragging && dragState.over && dragState.dragging !== dragState.over && dragState.list === listKey) {
        const fromIdx = items.findIndex(i => i.id === dragState.dragging);
        const toIdx = items.findIndex(i => i.id === dragState.over);
        if (fromIdx >= 0 && toIdx >= 0) {
          const reordered = [...items];
          const [moved] = reordered.splice(fromIdx, 1);
          reordered.splice(toIdx, 0, moved);
          setItems(reordered);
        }
      }
      setDragState({ dragging: null, over: null, list: null });
    },
    isDragging: (id) => dragState.dragging === id && dragState.list === listKey,
    isOver: (id) => dragState.over === id && dragState.list === listKey,
  }), [dragState]);

  // ─── Section-level drag reorder (per page) ─────────────────────
  const [sectionOrder, setSectionOrder] = useState({
    simple: ["snapshot", "countdown", "projection", "freedom", "cta"],
    dashboard: ["kpis", "country", "retirement", "charts", "surplus", "tax", "import"],
    budget: ["budgetGrid", "summary", "budgetVsActual", "spendingTrends"],
    investments: ["portfolioHeader", "holdings", "accounts", "accountChart", "allocation", "growth"],
    networth: ["nwHero", "nwChart", "assetsLiabs", "cashflow"],
    goals: ["goalCards", "goalSummary"],
    retirement: ["profileInputs", "retireResult", "trajectory", "fire", "boost", "accelerator"],
  });
  const [sectionDrag, setSectionDrag] = useState({ dragging: null, over: null, page: null });

  const sectionDragHandlers = useCallback((page) => ({
    onDragStart: (e, sectionId) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", sectionId);
      setSectionDrag({ dragging: sectionId, over: null, page });
    },
    onDragOver: (e, sectionId) => {
      e.preventDefault();
      e.stopPropagation();
      if (sectionDrag.page === page) setSectionDrag(prev => ({ ...prev, over: sectionId }));
    },
    onDragEnd: () => {
      if (sectionDrag.dragging && sectionDrag.over && sectionDrag.dragging !== sectionDrag.over && sectionDrag.page === page) {
        setSectionOrder(prev => {
          const order = [...(prev[page] || [])];
          const fromIdx = order.indexOf(sectionDrag.dragging);
          const toIdx = order.indexOf(sectionDrag.over);
          if (fromIdx >= 0 && toIdx >= 0) {
            const [moved] = order.splice(fromIdx, 1);
            order.splice(toIdx, 0, moved);
            return { ...prev, [page]: order };
          }
          return prev;
        });
      }
      setSectionDrag({ dragging: null, over: null, page: null });
    },
    isDragging: (id) => sectionDrag.dragging === id && sectionDrag.page === page,
    isOver: (id) => sectionDrag.over === id && sectionDrag.page === page,
  }), [sectionDrag]);

  // Render sections in order
  const renderSections = useCallback((page, sectionMap) => {
    const order = sectionOrder[page] || Object.keys(sectionMap);
    const handlers = sectionDragHandlers(page);
    return order.filter(id => sectionMap[id]).map(id => {
      const content = sectionMap[id];
      if (!content) return null;
      return (
        <div
          key={id}
          draggable
          onDragStart={(e) => handlers.onDragStart(e, id)}
          onDragOver={(e) => handlers.onDragOver(e, id)}
          onDragEnd={handlers.onDragEnd}
          style={{
            opacity: handlers.isDragging(id) ? 0.35 : 1,
            outline: handlers.isOver(id) ? "2px dashed var(--accent)" : "none",
            outlineOffset: 4,
            borderRadius: 14,
            transition: "opacity 0.2s, outline 0.15s",
            position: "relative",
            cursor: "grab",
          }}
        >
          {/* Drag indicator */}
          <div style={{ position: "absolute", top: 6, right: 8, fontSize: 12, color: "var(--text-muted)", opacity: 0.25, fontFamily: "'DM Mono', monospace", pointerEvents: "none", zIndex: 1 }}>⠿</div>
          {content}
        </div>
      );
    });
  }, [sectionOrder, sectionDragHandlers]);

  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  // Auto-apply country assumptions to profile
  const applyCountryDefaults = useCallback((c) => {
    setProfile(prev => ({
      ...prev,
      inflationRate: c.inflation,
      taxRate: c.withdrawalTax,
      lifeExpectancy: c.lifeExpect,
    }));
    setCurrencyCode(CURRENCIES.find(cur => cur.code === c.currency)?.code || "EUR");
    setCountryApplied(true);
    setTimeout(() => setCountryApplied(false), 3000);
  }, []);

  // Fetch deeper country insights via Claude API
  const fetchCountryInsights = useCallback(async (c) => {
    setCountryInsightsLoading(true);
    setCountryInsights(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `For ${c.name}, provide current financial planning data. Return ONLY JSON (no markdown, no backticks):
{
  "inflationForecast3y": number (avg annual % next 3 years),
  "inflationForecast5y": number (avg annual % next 5 years),
  "centralBankRate": number (current key interest rate %),
  "avgSavingsRate": number (typical savings account rate %),
  "avgMortgageRate": number (current avg mortgage rate %),
  "stockMarketYTD": number (main index YTD return %),
  "realEstateGrowth1y": number (avg property price change last year %),
  "retirementAgeOfficial": number,
  "retirementAgeTrend": "rising" or "stable" or "falling",
  "taxTips": "1-2 sentence tax optimization tip for investors in this country",
  "bestRetirementAccounts": "comma-separated list of tax-advantaged account types",
  "socialSecurityMonthly": number or null (approx monthly state pension in local currency),
  "costOfLivingIndex": number (relative to US=100),
  "headline": "1 sentence summary of current economic outlook for personal finance"
}`
          }],
        }),
      });
      const data = await response.json();
      const textBlocks = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setCountryInsights(parsed);
    } catch (err) {
      console.error("Country insights error:", err);
    } finally {
      setCountryInsightsLoading(false);
    }
  }, []);

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const sym = currency.symbol;
  const f = (n) => fmt(n, sym);
  const ff = (n) => fmtFull(n, sym);

  // ─── Fetch asset data via Claude API ────────────────────────────
  const openAssetDetail = useCallback(async (ticker, investmentId) => {
    if (!ticker || !ticker.trim()) return;
    setAssetView({ ticker: ticker.trim().toUpperCase(), investmentId });
    setTab("assetDetail");
    setAssetLoading(true);
    setAssetError(null);
    setAssetData(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `Look up the ticker symbol "${ticker.trim().toUpperCase()}" and return ONLY a JSON object (no markdown, no backticks, no preamble) with this exact structure:
{
  "name": "full company/fund name",
  "ticker": "${ticker.trim().toUpperCase()}",
  "assetType": "Stock" or "ETF" or "Bond" or "Crypto" or "REIT" or "Mutual Fund",
  "exchange": "exchange name",
  "currency": "trading currency code",
  "currentPrice": number,
  "previousClose": number,
  "dayChange": number,
  "dayChangePct": number,
  "high52w": number,
  "low52w": number,
  "marketCap": "formatted string or null",
  "peRatio": number or null,
  "dividendYield": number or null,
  "expenseRatio": number or null,
  "beta": number or null,
  "volume": "formatted string",
  "avgVolume": "formatted string or null",
  "sector": "sector name or null",
  "industry": "industry or null",
  "description": "2-3 sentence description of what this asset is",
  "ytdReturn": number or null,
  "return1y": number or null,
  "return3y": number or null,
  "return5y": number or null,
  "holdings": "top 5 holdings as a string, or null for single stocks",
  "monthlyPrices": [12 numbers representing approximate monthly closing prices for the last 12 months, oldest first]
}
Use real current data from web search. All return values should be percentages (e.g. 12.5 for 12.5%). If data is unavailable use null.`
          }],
        }),
      });

      const data = await response.json();
      const textBlocks = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setAssetData(parsed);
    } catch (err) {
      console.error("Asset fetch error:", err);
      setAssetError("Could not fetch data for this ticker. Please check the symbol and try again.");
    } finally {
      setAssetLoading(false);
    }
  }, []);

  // ─── Upload & parse document via Claude API ─────────────────────
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setUploadParsing(true);
    setUploadResult(null);

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });

      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      const mediaType = isImage ? file.type : isPDF ? "application/pdf" : "text/plain";

      let userContent;
      if (isImage) {
        userContent = [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: UPLOAD_PROMPT }
        ];
      } else if (isPDF) {
        userContent = [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: UPLOAD_PROMPT }
        ];
      } else {
        // Text/CSV — decode and send as text
        const text = atob(base64);
        userContent = [{ type: "text", text: `Here is my financial document:\n\n${text}\n\n${UPLOAD_PROMPT}` }];
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      const data = await response.json();
      const textBlocks = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // Apply parsed data
      if (parsed.income && parsed.income.length > 0) {
        setBudget(prev => ({
          ...prev,
          income: parsed.income.map(i => ({ id: uid(), name: i.name, amount: i.amount || 0 })),
        }));
      }
      if (parsed.expenses && parsed.expenses.length > 0) {
        setBudget(prev => ({
          ...prev,
          expenses: parsed.expenses.map(e => ({ id: uid(), name: e.name, amount: e.amount || 0, category: e.category || "lifestyle" })),
        }));
      }
      if (parsed.investments && parsed.investments.length > 0) {
        setInvestments(parsed.investments.map(i => ({
          id: uid(),
          name: i.name || "Imported",
          ticker: i.ticker || "",
          balance: i.balance || 0,
          monthlyContribution: i.monthlyContribution || 0,
          annualReturn: i.annualReturn || 7,
          type: i.type || "stocks",
        })));
      }

      setUploadResult({ success: true, summary: parsed.summary || "Data imported successfully", fileName: file.name });
    } catch (err) {
      console.error("Upload parse error:", err);
      setUploadResult({ success: false, summary: "Could not parse this file. Try a CSV, PDF, image, or text file with budget/investment data.", fileName: file.name });
    } finally {
      setUploadParsing(false);
    }
  }, []);

  // ─── Upload actuals (bank statement / transaction export) ───────
  const handleActualsUpload = useCallback(async (file) => {
    if (!file) return;
    setActualsUploading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      const actualsPrompt = `Analyze this financial document (bank statement, transaction export, or spending report). Categorize all expenses into: housing, essentials, lifestyle, savings. Group by month. Return ONLY JSON (no markdown, no backticks):
{
  "months": {
    "YYYY-MM": { "housing": total_number, "essentials": total_number, "lifestyle": total_number, "savings": total_number, "income": total_number },
    ...
  },
  "transactions": [
    { "date": "YYYY-MM-DD", "description": "merchant/description", "amount": number, "category": "housing"|"essentials"|"lifestyle"|"savings"|"income" }
  ]
}
Positive amounts for expenses, negative for income. Categorize conservatively: rent/mortgage/utilities→housing, groceries/insurance/transport→essentials, restaurants/entertainment/shopping→lifestyle, transfers to savings/investments→savings.`;

      let userContent;
      if (isImage) {
        userContent = [
          { type: "image", source: { type: "base64", media_type: file.type, data: base64 } },
          { type: "text", text: actualsPrompt }
        ];
      } else if (isPDF) {
        userContent = [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: actualsPrompt }
        ];
      } else {
        const text = atob(base64);
        userContent = [{ type: "text", text: `Here is my transaction data:\n\n${text}\n\n${actualsPrompt}` }];
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: userContent }],
        }),
      });
      const data = await response.json();
      const textBlocks = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.months) {
        setActuals(prev => ({ ...prev, ...parsed.months }));
        const monthKeys = Object.keys(parsed.months);
        if (monthKeys.length > 0) setActualsMonth(monthKeys[monthKeys.length - 1]);
      }
    } catch (err) {
      console.error("Actuals parse error:", err);
    } finally {
      setActualsUploading(false);
    }
  }, []);

  // ─── Computed values ──────────────────────────────────────────
  const totalIncome = useMemo(() => budget.income.reduce((s, i) => s + (i.amount || 0), 0), [budget.income]);
  const totalExpenses = useMemo(() => budget.expenses.reduce((s, i) => s + (i.amount || 0), 0), [budget.expenses]);
  const monthlySurplus = totalIncome - totalExpenses;
  const totalInvestmentContribution = useMemo(() => investments.reduce((s, i) => s + (i.monthlyContribution || 0), 0), [investments]);
  const totalPortfolioBalance = useMemo(() => investments.reduce((s, i) => s + (i.balance || 0), 0), [investments]);

  // Weighted average return
  const weightedReturn = useMemo(() => {
    const totalBal = investments.reduce((s, i) => s + (i.balance || 0), 0);
    if (totalBal === 0) return 7;
    return investments.reduce((s, i) => s + (i.annualReturn || 0) * ((i.balance || 0) / totalBal), 0);
  }, [investments]);

  // ─── Retirement projection ─────────────────────────────────────
  const projection = useMemo(() => {
    const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
    const monthlyReturn = weightedReturn / 100 / 12;
    const monthlyInflation = inflationRate / 100 / 12;
    const data = [];
    let bal = totalPortfolioBalance;
    const monthlyContrib = totalInvestmentContribution;
    const yearsToProject = Math.max(lifeExpectancy - currentAge + 5, 40);

    // Phase 1: accumulation — find when we can retire
    let retireAge = null;
    for (let y = 0; y <= yearsToProject; y++) {
      const age = currentAge + y;
      // Required nest egg at this age (4% rule adjusted for inflation + tax)
      const futureMonthlySpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
      const annualSpend = futureMonthlySpend * 12 / (1 - taxRate / 100);
      const requiredNestEgg = annualSpend / 0.04;

      data.push({ age, value: Math.round(bal), required: Math.round(requiredNestEgg) });

      if (bal >= requiredNestEgg && retireAge === null && age > currentAge) {
        retireAge = age;
      }

      // Grow portfolio
      for (let m = 0; m < 12; m++) {
        bal = bal * (1 + monthlyReturn) + monthlyContrib;
      }
    }

    return { data, retireAge: retireAge || lifeExpectancy, yearsToRetire: retireAge ? retireAge - currentAge : null };
  }, [profile, totalPortfolioBalance, totalInvestmentContribution, weightedReturn]);

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const map = {};
    budget.expenses.forEach(e => {
      const cat = e.category || "other";
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([cat, value]) => ({ name: cat, value, color: CATEGORY_COLORS[cat] || "#888" }));
  }, [budget.expenses]);

  // Investment breakdown
  const investmentByType = useMemo(() => {
    const map = {};
    investments.forEach(i => {
      const t = i.type || "other";
      map[t] = (map[t] || 0) + (i.balance || 0);
    });
    return Object.entries(map).map(([t, value]) => ({ name: t, value, color: INVESTMENT_COLORS[t] || "#888" }));
  }, [investments]);

  // 12-month savings projection
  const savingsTrajectory = useMemo(() => {
    const arr = [];
    let bal = totalPortfolioBalance;
    const mr = weightedReturn / 100 / 12;
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + mr) + totalInvestmentContribution;
      arr.push(Math.round(bal));
    }
    return arr;
  }, [totalPortfolioBalance, totalInvestmentContribution, weightedReturn]);

  // ─── Simple Mode Calculations (S&P 500 @ 10% avg) ──────────────
  const SP500_RETURN = 10.0; // long-term avg annual return
  const SP500_MR = SP500_RETURN / 100 / 12;

  const simpleProjection = useMemo(() => {
    const yearsToRetire = Math.max(0, simpleRetireAge - simpleAge);
    let bal = simpleInvested + simpleCash;
    const data = [];
    for (let y = 0; y <= yearsToRetire + 10; y++) {
      data.push({ age: simpleAge + y, value: Math.round(bal) });
      for (let m = 0; m < 12; m++) bal = bal * (1 + SP500_MR) + simpleMonthlyContrib;
    }
    const atRetire = data.find(d => d.age === simpleRetireAge)?.value || 0;
    return { data, atRetire, yearsToRetire };
  }, [simpleInvested, simpleCash, simpleAge, simpleRetireAge, simpleMonthlyContrib]);

  // Freedom calculator — how much faster with extra investment
  const freedomCalc = useMemo(() => {
    const extra = parseFloat(simpleFreedomAmount) || 0;
    if (extra <= 0) return null;

    const targetAge = simpleRetireAge;
    const targetValue = simpleProjection.atRetire;

    // Current path — already computed
    const currentAge = simpleRetireAge;

    // Boosted path
    let bal = simpleInvested + simpleCash + (simpleFreedomMode === "onetime" ? extra : 0);
    const monthlyExtra = simpleFreedomMode === "monthly" ? extra : 0;
    let boostedAge = null;
    for (let y = 0; y <= 60; y++) {
      if (bal >= targetValue && y > 0) { boostedAge = simpleAge + y; break; }
      for (let m = 0; m < 12; m++) bal = bal * (1 + SP500_MR) + simpleMonthlyContrib + monthlyExtra;
    }
    if (!boostedAge) boostedAge = simpleAge + 60;

    const yearsSaved = Math.max(0, simpleRetireAge - boostedAge);
    const daysSaved = yearsSaved * 365;

    // What the extra becomes by retirement
    let extraGrowth = simpleFreedomMode === "onetime" ? extra : 0;
    const monthsToRetire = (simpleRetireAge - simpleAge) * 12;
    for (let m = 0; m < monthsToRetire; m++) {
      extraGrowth = extraGrowth * (1 + SP500_MR) + monthlyExtra;
    }

    return { boostedAge, yearsSaved, daysSaved, extraGrowth: Math.round(extraGrowth), targetValue };
  }, [simpleFreedomAmount, simpleFreedomMode, simpleInvested, simpleCash, simpleAge, simpleRetireAge, simpleMonthlyContrib, simpleProjection]);

  // ─── Net Worth ──────────────────────────────────────────────────
  const totalAssets = useMemo(() => assets.reduce((s, a) => s + (a.value || 0), 0) + totalPortfolioBalance, [assets, totalPortfolioBalance]);
  const totalLiabilities = useMemo(() => liabilities.reduce((s, l) => s + (l.value || 0), 0), [liabilities]);
  const netWorth = totalAssets - totalLiabilities;

  // Snapshot net worth for history
  useEffect(() => {
    const key = new Date().toISOString().slice(0, 7);
    setNwHistory(prev => {
      const exists = prev.find(p => p.month === key);
      if (exists) return prev.map(p => p.month === key ? { ...p, value: netWorth } : p);
      return [...prev, { month: key, value: netWorth }].slice(-24);
    });
  }, [netWorth]);

  // ─── Debt Payoff Calculator ─────────────────────────────────────
  const debtPayoff = useMemo(() => {
    if (liabilities.length === 0) return { months: 0, totalInterest: 0, schedule: [] };
    let debts = liabilities.filter(l => l.value > 0).map(l => ({ ...l, remaining: l.value }));
    if (debts.length === 0) return { months: 0, totalInterest: 0, schedule: [] };

    // Sort by strategy
    if (debtStrategy === "avalanche") debts.sort((a, b) => (b.rate || 0) - (a.rate || 0));
    else debts.sort((a, b) => a.remaining - b.remaining);

    const schedule = [];
    let months = 0, totalInterest = 0, extra = debtExtra;
    const maxMonths = 600;

    while (debts.some(d => d.remaining > 0.01) && months < maxMonths) {
      months++;
      let extraLeft = extra;
      debts.forEach(d => {
        if (d.remaining <= 0) return;
        const interest = d.remaining * ((d.rate || 0) / 100 / 12);
        totalInterest += interest;
        let payment = (d.monthlyPayment || 0) + interest;
        // Apply extra to first debt with balance
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
  }, [liabilities, debtStrategy, debtExtra]);

  // ─── FIRE Variants ──────────────────────────────────────────────
  const fireCalc = useMemo(() => {
    const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
    const mr = weightedReturn / 100 / 12;
    const results = {};

    // Traditional
    results.traditional = { age: projection.retireAge, years: projection.yearsToRetire };

    // Coast FIRE: stop contributing, when does compounding alone get you there?
    let coastBal = totalPortfolioBalance;
    let coastAge = null;
    for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
      const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
      const required = (futureSpend * 12 / (1 - taxRate / 100)) / 0.04;
      if (coastBal >= required && y > 0) { coastAge = currentAge + y; break; }
      for (let m = 0; m < 12; m++) coastBal *= (1 + mr); // no contributions
    }
    results.coast = { age: coastAge || lifeExpectancy, canCoast: coastAge !== null };

    // Barista FIRE: part-time income covers expenses, portfolio grows untouched
    let baristaBal = totalPortfolioBalance;
    let baristaAge = null;
    for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
      const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
      const gap = Math.max(0, futureSpend - baristaIncome);
      const required = (gap * 12 / (1 - taxRate / 100)) / 0.04;
      if (baristaBal >= required && y > 0) { baristaAge = currentAge + y; break; }
      for (let m = 0; m < 12; m++) baristaBal = baristaBal * (1 + mr) + totalInvestmentContribution;
    }
    results.barista = { age: baristaAge || lifeExpectancy, income: baristaIncome };

    // Lean FIRE
    results.lean = { age: computeRetireAgeSpend(leanSpend), spend: leanSpend };

    // Fat FIRE
    results.fat = { age: computeRetireAgeSpend(fatSpend), spend: fatSpend };

    return results;
  }, [profile, totalPortfolioBalance, totalInvestmentContribution, weightedReturn, baristaIncome, leanSpend, fatSpend, projection]);

  // ─── Cash Flow Calendar ─────────────────────────────────────────
  const cashFlowWeeks = useMemo(() => {
    const weeks = [];
    const weeklyIncome = totalIncome / 4.33;
    const weeklyExpense = totalExpenses / 4.33;
    let running = 0;
    for (let w = 1; w <= 5; w++) {
      const inc = w === 1 ? totalIncome * 0.5 : w === 3 ? totalIncome * 0.5 : 0; // Assume bi-monthly pay
      const exp = weeklyExpense;
      running += inc - exp;
      weeks.push({ week: w, income: Math.round(inc), expenses: Math.round(exp), balance: Math.round(running) });
    }
    return weeks;
  }, [totalIncome, totalExpenses]);

  // ─── Export Report ──────────────────────────────────────────────
  const exportReport = useCallback(() => {
    const report = `
HORIZON FINANCIAL PLAN — ${new Date().toLocaleDateString()}
${"═".repeat(50)}

NET WORTH: ${fmtFull(netWorth, sym)}
  Assets: ${fmtFull(totalAssets, sym)}
  Liabilities: ${fmtFull(totalLiabilities, sym)}

MONTHLY BUDGET
  Income: ${fmtFull(totalIncome, sym)}
  Expenses: ${fmtFull(totalExpenses, sym)}
  Surplus: ${fmtFull(totalIncome - totalExpenses, sym)}

PORTFOLIO: ${fmtFull(totalPortfolioBalance, sym)}
  Monthly Contributions: ${fmtFull(totalInvestmentContribution, sym)}
  Weighted Return: ${weightedReturn.toFixed(1)}%

INVESTMENTS
${investments.map(i => `  ${i.name}${i.ticker ? ` (${i.ticker})` : ""}: ${fmtFull(i.balance, sym)} — ${fmtFull(i.monthlyContribution, sym)}/mo @ ${i.annualReturn}%`).join("\n")}

RETIREMENT PROJECTION
  Current Age: ${profile.currentAge}
  Retirement Age: ${projection.retireAge}
  Years to Retire: ${projection.yearsToRetire ?? "N/A"}
  Monthly Spend (today): ${fmtFull(profile.retireSpend, sym)}
  Inflation: ${profile.inflationRate}% | Tax: ${profile.taxRate}%

FIRE PATHWAYS
  Traditional: Age ${fireCalc.traditional?.age}
  Coast FIRE: Age ${fireCalc.coast?.age}
  Barista FIRE: Age ${fireCalc.barista?.age}
  Lean FIRE: Age ${fireCalc.lean?.age}
  Fat FIRE: Age ${fireCalc.fat?.age}

GOALS
${goals.map(g => `  ${g.icon} ${g.name}: ${fmtFull(g.saved, sym)} / ${fmtFull(g.target, sym)} (${g.target > 0 ? ((g.saved/g.target)*100).toFixed(0) : 0}%)`).join("\n")}

DEBTS
${liabilities.map(l => `  ${l.name}: ${fmtFull(l.value, sym)} @ ${l.rate}%`).join("\n")}
  Debt-free in: ${debtPayoff.months < 600 ? `${Math.floor(debtPayoff.months/12)}y ${debtPayoff.months%12}mo` : "N/A"}

Country: ${country.name} | Currency: ${currencyCode}
Generated by Horizon Financial Platform
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `horizon-financial-plan-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [netWorth, totalAssets, totalLiabilities, totalIncome, totalExpenses, totalPortfolioBalance, totalInvestmentContribution, weightedReturn, investments, profile, projection, fireCalc, goals, liabilities, debtPayoff, country, currencyCode, sym]);

  // ─── Handlers ──────────────────────────────────────────────────
  const updateBudgetItem = (section, id, updated) => {
    setBudget(prev => ({
      ...prev,
      [section]: prev[section].map(i => i.id === id ? updated : i),
    }));
  };
  const addBudgetItem = (section) => {
    setBudget(prev => ({
      ...prev,
      [section]: [...prev[section], { id: uid(), name: "New item", amount: 0, ...(section === "expenses" ? { category: "lifestyle" } : {}) }],
    }));
  };
  const deleteBudgetItem = (section, id) => {
    setBudget(prev => ({ ...prev, [section]: prev[section].filter(i => i.id !== id) }));
  };

  const updateInvestment = (id, updated) => {
    setInvestments(prev => prev.map(i => i.id === id ? updated : i));
  };
  const addInvestment = () => {
    setInvestments(prev => [...prev, { id: uid(), name: "New Investment", ticker: "", balance: 0, monthlyContribution: 0, annualReturn: 7, type: "stocks", account: "brokerage" }]);
  };
  const deleteInvestment = (id) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  // ─── Styles ────────────────────────────────────────────────────
  const theme = {
    "--bg": "#0C0F14",
    "--surface": "#13171E",
    "--surface-raised": "#1A1F28",
    "--surface-hover": "#222833",
    "--border": "#2A3040",
    "--border-focus": "#5B8DEF",
    "--text-primary": "#E8ECF4",
    "--text-secondary": "#A0AAC0",
    "--text-muted": "#5E6882",
    "--accent": "#5B8DEF",
    "--accent-soft": "rgba(91,141,239,0.12)",
    "--green": "#7CCA98",
    "--green-soft": "rgba(124,202,152,0.12)",
    "--red": "#E8927C",
    "--red-soft": "rgba(232,146,124,0.12)",
    "--yellow": "#F0C75E",
  };

  const card = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 20,
  };

  const tabBtn = (active) => ({
    background: active ? "var(--accent-soft)" : "transparent",
    color: active ? "var(--accent)" : "var(--text-muted)",
    border: "1px solid " + (active ? "var(--accent)" : "transparent"),
    borderRadius: 10,
    padding: "8px 18px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  });

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    marginBottom: 10,
    fontFamily: "'DM Mono', monospace",
  };

  const statNumber = {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.1,
  };

  const addBtn = {
    background: "var(--surface-raised)",
    border: "1px dashed var(--border)",
    borderRadius: 8,
    padding: "6px 14px",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    marginTop: 8,
    transition: "all 0.2s",
  };

  const dragHandle = {
    cursor: "grab",
    color: "var(--text-muted)",
    fontSize: 14,
    userSelect: "none",
    padding: "0 4px",
    opacity: 0.4,
    lineHeight: 1,
  };

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{ ...theme, background: "var(--bg)", color: "var(--text-primary)", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ─── Header ────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px 0", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Horizon</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: 6, fontFamily: "'DM Mono', monospace" }}>BETA</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Financial Planning Platform</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {/* ─── Simple / Advanced Toggle ─── */}
            <div style={{ display: "flex", background: "var(--surface-raised)", borderRadius: 10, padding: 3, border: "1px solid var(--border)" }}>
              {["simple", "advanced"].map(m => (
                <button key={m} onClick={() => { setViewMode(m); if (m === "simple") setTab("dashboard"); }}
                  style={{
                    background: viewMode === m ? (m === "simple" ? "var(--green)" : "var(--accent)") : "transparent",
                    color: viewMode === m ? "#0C0F14" : "var(--text-muted)",
                    border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer",
                    fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s", textTransform: "capitalize",
                  }}
                >{m}</button>
              ))}
            </div>

            {/* Advanced tabs — only shown in advanced mode */}
            {viewMode === "advanced" && (
              <>
                <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 2px" }} />
                {[
                  { key: "dashboard", label: "◉ Dashboard" },
                  { key: "budget", label: "◧ Budget" },
                  { key: "investments", label: "◈ Investments" },
                  { key: "networth", label: "◆ Net Worth" },
                  { key: "goals", label: "◎ Goals" },
                  { key: "retirement", label: "⦿ Retirement" },
                ].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
                    {t.label}
                  </button>
                ))}
              </>
            )}

            <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 2px" }} />
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "8px 12px",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Mono', monospace",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235E6882'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                paddingRight: 28,
              }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
              ))}
            </select>
            <button onClick={exportReport} style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }} title="Export financial plan">↓ Export</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" }}>

        {/* ═══════════════════ SIMPLE MODE ═══════════════════════════ */}
        {viewMode === "simple" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {renderSections("simple", {

            snapshot: (
            <div style={{ ...card, background: "linear-gradient(135deg, var(--surface) 0%, rgba(91,141,239,0.04) 100%)", padding: "28px 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Your Financial Snapshot</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Enter your basics to see your retirement path</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                {[
                  { label: "Total Invested", value: simpleInvested, set: setSimpleInvested, icon: "📈", color: "var(--accent)", isCurrency: true },
                  { label: "Cash Savings", value: simpleCash, set: setSimpleCash, icon: "💰", color: "var(--green)", isCurrency: true },
                  { label: "Monthly Contribution", value: simpleMonthlyContrib, set: setSimpleMonthlyContrib, icon: "↻", color: "var(--yellow)", isCurrency: true },
                  { label: "Your Age", value: simpleAge, set: setSimpleAge, icon: "🎂", color: "var(--text-secondary)" },
                  { label: "Target Retirement Age", value: simpleRetireAge, set: setSimpleRetireAge, icon: "🏖️", color: "var(--green)" },
                ].map((f, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 14 }}>{f.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{f.label}</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      {f.isCurrency && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", pointerEvents: "none", zIndex: 1 }}>{sym}</span>}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={f.isCurrency ? f.value.toLocaleString("en") : f.value}
                        onFocus={(e) => { e.target.value = String(f.value); e.target.select(); }}
                        onBlur={(e) => {
                          const raw = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                          f.set(raw);
                          e.target.value = f.isCurrency ? raw.toLocaleString("en") : String(raw);
                        }}
                        onChange={(e) => {
                          const raw = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                          f.set(raw);
                        }}
                        style={{ width: "100%", background: "var(--surface-raised)", border: "2px solid var(--border)", borderRadius: 10, padding: f.isCurrency ? "12px 12px 12px 32px" : "12px", color: f.color, fontSize: 20, fontFamily: "'DM Mono', monospace", fontWeight: 700, outline: "none", transition: "border-color 0.2s" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            ),

            countdown: (
            <div>
            {(() => {
              const yearsLeft = Math.max(0, simpleRetireAge - simpleAge);
              const totalMonths = yearsLeft * 12;
              const totalDays = Math.round(yearsLeft * 365.25);
              const yrs = yearsLeft;
              const mos = totalMonths % 12;
              // Approximate: assume birthday = Jan 1 for simplicity
              const retireDate = new Date();
              retireDate.setFullYear(retireDate.getFullYear() + yearsLeft);
              const now = new Date();
              const diffMs = retireDate - now;
              const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
              const dYears = Math.floor(diffDays / 365);
              const dMonths = Math.floor((diffDays % 365) / 30);
              const dDays = diffDays % 30;

              return (
                <div style={{ ...card, textAlign: "center", padding: "24px 20px", background: "linear-gradient(135deg, var(--surface) 0%, rgba(124,202,152,0.05) 100%)", border: "1px solid rgba(124,202,152,0.2)" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>You can retire in</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { value: dYears, label: dYears === 1 ? "Year" : "Years" },
                      { value: dMonths, label: dMonths === 1 ? "Month" : "Months" },
                      { value: dDays, label: dDays === 1 ? "Day" : "Days" },
                    ].map((u, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
                        <div style={{ fontSize: 42, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{u.value}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{u.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 14, fontWeight: 600 }}>
                    at age <span style={{ color: "var(--green)", fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700 }}>{simpleRetireAge}</span>
                  </div>
                  {totalDays > 0 && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>
                      {totalDays.toLocaleString()} total days · {totalMonths.toLocaleString()} total months
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
            ),

            projection: (
            <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, var(--surface) 0%, rgba(124,202,152,0.06) 100%)", padding: 28 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>At age {simpleRetireAge}, investing {ff(simpleMonthlyContrib)}/mo in the S&P 500 (~{SP500_RETURN}% avg return)</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>Your portfolio will be worth</div>
              <div style={{ fontSize: 52, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{ff(simpleProjection.atRetire)}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8 }}>
                That's <strong style={{ color: "var(--green)" }}>{simpleProjection.yearsToRetire} years</strong> of compounding from a starting balance of <strong style={{ color: "var(--accent)" }}>{ff(simpleInvested + simpleCash)}</strong>
              </div>

              {/* Mini projection chart */}
              {simpleProjection.data.length > 1 && (() => {
                const data = simpleProjection.data;
                const maxVal = Math.max(...data.map(d => d.value));
                return (
                  <svg width="100%" height="120" viewBox="0 0 600 120" style={{ marginTop: 16 }}>
                    <defs>
                      <linearGradient id="simpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7CCA98" stopOpacity="0.25" /><stop offset="100%" stopColor="#7CCA98" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <path d={data.map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1) * 600).toFixed(1)} ${(110 - (d.value / maxVal) * 100).toFixed(1)}`).join(" ") + " L 600 110 L 0 110 Z"} fill="url(#simpleGrad)" />
                    <path d={data.map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1) * 600).toFixed(1)} ${(110 - (d.value / maxVal) * 100).toFixed(1)}`).join(" ")} fill="none" stroke="#7CCA98" strokeWidth="2.5" strokeLinejoin="round" />
                    {(() => {
                      const retireIdx = data.findIndex(d => d.age === simpleRetireAge);
                      if (retireIdx < 0) return null;
                      const x = (retireIdx / (data.length - 1)) * 600;
                      return <>
                        <line x1={x} y1={5} x2={x} y2={110} stroke="#7CCA98" strokeWidth="1.5" strokeDasharray="4,3" />
                        <circle cx={x} cy={110 - (data[retireIdx].value / maxVal) * 100} r="5" fill="#7CCA98" />
                      </>;
                    })()}
                    <text x="4" y="118" fill="var(--text-muted)" fontSize="10" fontFamily="'DM Mono', monospace">Age {data[0]?.age}</text>
                    <text x="596" y="118" fill="var(--text-muted)" fontSize="10" fontFamily="'DM Mono', monospace" textAnchor="end">Age {data[data.length-1]?.age}</text>
                  </svg>
                );
              })()}
            </div>
            ),

            freedom: (
            <div style={{ ...card, padding: 0, overflow: "hidden", border: "1px solid rgba(124,202,152,0.3)" }}>
              <div style={{ padding: "18px 22px", background: "linear-gradient(135deg, rgba(124,202,152,0.08) 0%, rgba(91,141,239,0.04) 100%)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🚀</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Faster to Freedom</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>What if you invested more into the S&P 500?</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["monthly", "onetime"].map(m => (
                    <button key={m} onClick={() => setSimpleFreedomMode(m)} style={{
                      background: simpleFreedomMode === m ? "var(--green-soft)" : "var(--surface-raised)",
                      border: `1px solid ${simpleFreedomMode === m ? "var(--green)" : "var(--border)"}`,
                      borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                      color: simpleFreedomMode === m ? "var(--green)" : "var(--text-muted)",
                      fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace",
                    }}>{m === "monthly" ? "↻ Monthly" : "◎ One-time"}</button>
                  ))}
                </div>
              </div>

              <div style={{ padding: "20px 22px", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
                {/* Input */}
                <div style={{ flex: "1 1 260px", minWidth: 220 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", display: "block", marginBottom: 8 }}>
                    {simpleFreedomMode === "monthly" ? "Extra monthly into S&P 500" : "One-time lump sum into S&P 500"}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", pointerEvents: "none" }}>{sym}</span>
                      <input type="number" value={simpleFreedomAmount} placeholder="0"
                        onChange={(e) => setSimpleFreedomAmount(e.target.value)}
                        style={{ width: "100%", background: "var(--surface-raised)", border: `2px solid ${freedomCalc && freedomCalc.yearsSaved > 0 ? "var(--green)" : "var(--border)"}`, borderRadius: 12, padding: "16px 16px 16px 42px", color: "var(--text-primary)", fontSize: 28, fontFamily: "'DM Mono', monospace", fontWeight: 700, outline: "none" }}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{simpleFreedomMode === "monthly" ? "/mo" : "once"}</span>
                  </div>

                  {/* Quick presets */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {(simpleFreedomMode === "monthly" ? [50, 100, 250, 500, 1000] : [1000, 5000, 10000, 25000, 50000]).map(v => (
                      <button key={v} onClick={() => setSimpleFreedomAmount(String(v))}
                        style={{ background: parseFloat(simpleFreedomAmount) === v ? "var(--green-soft)" : "var(--surface-raised)", border: `1px solid ${parseFloat(simpleFreedomAmount) === v ? "var(--green)" : "var(--border)"}`, borderRadius: 8, padding: "6px 12px", color: parseFloat(simpleFreedomAmount) === v ? "var(--green)" : "var(--text-muted)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                        +{simpleFreedomMode === "onetime" ? f(v) : `${sym}${v}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Result */}
                <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                  {!freedomCalc ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 180, color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>
                      <div>
                        <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.3 }}>🏖️</div>
                        Enter an amount to see how much faster you can reach freedom
                      </div>
                    </div>
                  ) : freedomCalc.yearsSaved > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* Headline */}
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>You'd reach financial freedom</div>
                        <div style={{ fontSize: 56, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace", lineHeight: 1, marginTop: 4 }}>{freedomCalc.yearsSaved}</div>
                        <div style={{ fontSize: 16, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{freedomCalc.yearsSaved === 1 ? "year" : "years"} earlier</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
                          Age {simpleRetireAge} → Age {freedomCalc.boostedAge}
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div style={{ background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Days of freedom gained</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{freedomCalc.daysSaved.toLocaleString()}</div>
                        </div>
                        <div style={{ background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Your {sym} grows to</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{f(freedomCalc.extraGrowth)}</div>
                        </div>
                      </div>

                      {/* Visual comparison */}
                      <div style={{ background: "var(--surface-raised)", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--text-muted)", marginBottom: 3 }}>
                            <span>Current path</span><span>Age {simpleRetireAge}</span>
                          </div>
                          <div style={{ height: 10, background: "var(--surface)", borderRadius: 5, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: "100%", background: "var(--text-muted)", opacity: 0.3, borderRadius: 5 }} />
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--green)", marginBottom: 3 }}>
                            <span>With extra {simpleFreedomMode === "monthly" ? ff(parseFloat(simpleFreedomAmount))+"/mo" : ff(parseFloat(simpleFreedomAmount))+" lump sum"}</span><span>Age {freedomCalc.boostedAge}</span>
                          </div>
                          <div style={{ height: 10, background: "var(--surface)", borderRadius: 5, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.max(10, (freedomCalc.boostedAge - simpleAge) / Math.max(1, simpleRetireAge - simpleAge) * 100)}%`, background: "linear-gradient(90deg, var(--green), rgba(124,202,152,0.5))", borderRadius: 5, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                        Based on S&P 500 historical average return of ~{SP500_RETURN}% per year.<br />Past performance does not guarantee future results.
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--yellow)", fontFamily: "'DM Mono', monospace" }}>{"< 1 year"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Try a larger amount for a meaningful impact</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            ),

            cta: (
            <div style={{ ...card, textAlign: "center", padding: 20, border: "1px dashed var(--border)" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Want detailed budgets, investment analysis, FIRE pathways, and AI insights?</div>
              <button onClick={() => { setViewMode("advanced"); setTab("dashboard"); }}
                style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px 28px", color: "#0C0F14", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                Switch to Advanced Mode →
              </button>
            </div>
            ),

            })}
          </div>
        )}

        {/* ═══════════════════ ADVANCED MODE ═══════════════════════ */}
        {viewMode === "advanced" && <>

        {/* ═══════════════════ DASHBOARD ═══════════════════════════ */}
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { label: "Net Worth", value: ff(netWorth), color: netWorth >= 0 ? "var(--green)" : "var(--red)", sub: `${ff(totalAssets)} assets − ${ff(totalLiabilities)} debt` },
                { label: "Monthly Income", value: ff(totalIncome), color: "var(--green)", sub: "after tax" },
                { label: "Monthly Expenses", value: ff(totalExpenses), color: "var(--red)", sub: `${((totalExpenses / totalIncome) * 100 || 0).toFixed(0)}% of income` },
                { label: "Monthly Surplus", value: ff(monthlySurplus), color: monthlySurplus >= 0 ? "var(--green)" : "var(--red)", sub: monthlySurplus >= 0 ? "available to invest" : "overspending" },
                { label: "Portfolio Value", value: ff(totalPortfolioBalance), color: "var(--accent)", sub: `${ff(totalInvestmentContribution)}/mo contributions` },
              ].map((kpi, i) => (
                <div key={i} style={card}>
                  <div style={sectionLabel}>{kpi.label}</div>
                  <div style={{ ...statNumber, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Country & Assumptions */}
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {/* Left: selector */}
                <div style={{ flex: "1 1 300px", padding: 20, borderRight: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>🌍</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Country & Tax Profile</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Auto-applies inflation, tax & life expectancy assumptions</div>
                    </div>
                  </div>
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      const c = COUNTRIES.find(x => x.code === e.target.value);
                      setCountryCode(e.target.value);
                      if (c) { applyCountryDefaults(c); fetchCountryInsights(c); }
                    }}
                    style={{
                      width: "100%",
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      color: "var(--text-primary)",
                      fontSize: 15,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235E6882'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: 30,
                    }}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>

                  {/* Applied toast */}
                  {countryApplied && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "var(--green)", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>✓</span> Applied {country.name} defaults — inflation {country.inflation}%, withdrawal tax {country.withdrawalTax}%, life expectancy {country.lifeExpect}
                    </div>
                  )}

                  {/* Built-in assumptions grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
                    {[
                      { label: "Inflation", value: `${country.inflation}%`, color: "var(--yellow)" },
                      { label: "Cap. Gains Tax", value: `${country.capitalGainsTax}%`, color: "var(--red)" },
                      { label: "Withdrawal Tax", value: `${country.withdrawalTax}%`, color: "var(--red)" },
                      { label: "Life Expectancy", value: `${country.lifeExpect}`, color: "var(--accent)" },
                      { label: "Retire Age (official)", value: `${country.retireAge}`, color: "var(--green)" },
                      { label: "VAT", value: `${country.vatRate}%`, color: "var(--text-secondary)" },
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--surface-raised)", borderRadius: 6 }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{s.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pension system note */}
                  <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Pension:</strong> {country.pensionSystem}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5, fontStyle: "italic" }}>
                    {country.notes}
                  </div>
                </div>

                {/* Right: AI-powered insights */}
                <div style={{ flex: "1 1 300px", padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>Live Economic Data</span>
                    {!countryInsights && !countryInsightsLoading && (
                      <button
                        onClick={() => fetchCountryInsights(country)}
                        style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 6, padding: "3px 10px", color: "var(--accent)", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}
                      >
                        Load insights
                      </button>
                    )}
                    {countryInsightsLoading && (
                      <div style={{ display: "inline-block", width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    )}
                  </div>

                  {countryInsights ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {/* Headline */}
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, padding: "8px 10px", background: "var(--surface-raised)", borderRadius: 8, borderLeft: "3px solid var(--accent)" }}>
                        {countryInsights.headline}
                      </div>

                      {/* Stats grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        {[
                          { label: "Inflation 3y", value: countryInsights.inflationForecast3y != null ? `${countryInsights.inflationForecast3y}%` : "—", color: "var(--yellow)" },
                          { label: "Central Bank", value: countryInsights.centralBankRate != null ? `${countryInsights.centralBankRate}%` : "—", color: "var(--accent)" },
                          { label: "Mortgage Rate", value: countryInsights.avgMortgageRate != null ? `${countryInsights.avgMortgageRate}%` : "—", color: "var(--red)" },
                          { label: "Savings Rate", value: countryInsights.avgSavingsRate != null ? `${countryInsights.avgSavingsRate}%` : "—", color: "var(--green)" },
                          { label: "Market YTD", value: countryInsights.stockMarketYTD != null ? `${countryInsights.stockMarketYTD > 0 ? "+" : ""}${countryInsights.stockMarketYTD}%` : "—", color: countryInsights.stockMarketYTD >= 0 ? "var(--green)" : "var(--red)" },
                          { label: "Property 1y", value: countryInsights.realEstateGrowth1y != null ? `${countryInsights.realEstateGrowth1y > 0 ? "+" : ""}${countryInsights.realEstateGrowth1y}%` : "—", color: countryInsights.realEstateGrowth1y >= 0 ? "var(--green)" : "var(--red)" },
                        ].map((s, i) => (
                          <div key={i} style={{ background: "var(--surface-raised)", borderRadius: 6, padding: "8px 8px", textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{s.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Tax tip & best accounts */}
                      {countryInsights.taxTips && (
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, padding: "8px 10px", background: "rgba(124,202,152,0.06)", borderRadius: 8, borderLeft: "3px solid var(--green)" }}>
                          <strong style={{ color: "var(--green)" }}>Tax tip:</strong> {countryInsights.taxTips}
                        </div>
                      )}
                      {countryInsights.bestRetirementAccounts && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          <strong style={{ color: "var(--text-secondary)" }}>Tax-advantaged accounts:</strong> {countryInsights.bestRetirementAccounts}
                        </div>
                      )}
                      {countryInsights.socialSecurityMonthly && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          <strong style={{ color: "var(--text-secondary)" }}>Est. state pension:</strong> ~{ff(countryInsights.socialSecurityMonthly)}/mo
                        </div>
                      )}
                    </div>
                  ) : !countryInsightsLoading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>
                      Click "Load insights" to fetch live economic data, forecasts, and tax tips for {country.name}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Retirement headline + countdown */}
            <div style={{ ...card, background: "linear-gradient(135deg, var(--surface) 0%, rgba(91,141,239,0.06) 100%)", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
              <div style={{ flex: "1 1 300px" }}>
                <div style={sectionLabel}>Retirement Forecast</div>
                {projection.yearsToRetire !== null ? (
                  <>
                    <div style={{ ...statNumber, color: "var(--green)", fontSize: 36 }}>
                      Age {projection.retireAge}
                    </div>
                    {/* Countdown */}
                    {(() => {
                      const diffDays = Math.max(0, Math.floor(projection.yearsToRetire * 365.25));
                      const dYears = Math.floor(diffDays / 365);
                      const dMonths = Math.floor((diffDays % 365) / 30);
                      const dDays = diffDays % 30;
                      return (
                        <div style={{ display: "flex", gap: 12, marginTop: 10, marginBottom: 6 }}>
                          {[
                            { v: dYears, l: dYears === 1 ? "yr" : "yrs" },
                            { v: dMonths, l: dMonths === 1 ? "mo" : "mos" },
                            { v: dDays, l: dDays === 1 ? "day" : "days" },
                          ].map((u, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{u.v}</span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{u.l}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0 }}>
                      Based on {ff(profile.retireSpend)}/mo spending (today's {sym}) · {weightedReturn.toFixed(1)}% weighted return
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ ...statNumber, color: "var(--yellow)", fontSize: 28 }}>Not yet achievable</div>
                    <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "6px 0 0" }}>
                      Increase contributions or reduce retirement spending target
                    </p>
                  </>
                )}
              </div>
              <div style={{ flex: "1 1 350px", minWidth: 0 }}>
                <ProjectionChart data={projection.data} retireAge={projection.retireAge} height={180} sym={sym} />
              </div>
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              <div style={card}>
                <div style={sectionLabel}>Expense Breakdown</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <DonutChart segments={expenseByCategory} size={130} sym={sym} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {expenseByCategory.map((seg, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color }} />
                        <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{seg.name}</span>
                        <span style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{ff(seg.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={card}>
                <div style={sectionLabel}>Portfolio Allocation</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <DonutChart segments={investmentByType} size={130} sym={sym} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {investmentByType.map((seg, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color }} />
                        <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{seg.name}</span>
                        <span style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{ff(seg.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={card}>
                <div style={sectionLabel}>12-Month Portfolio Projection</div>
                <MiniBar data={savingsTrajectory} max={Math.max(...savingsTrajectory) * 1.1} color="var(--accent)" height={90} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Now: {ff(totalPortfolioBalance)}</span>
                  <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>12mo: {ff(savingsTrajectory[11])}</span>
                </div>
              </div>
            </div>

            {/* Surplus warning */}
            {monthlySurplus < totalInvestmentContribution && (
              <div style={{ ...card, background: "var(--red-soft)", border: "1px solid var(--red)" }}>
                <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 600 }}>⚠ Budget Gap Detected</div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  Your investment contributions ({ff(totalInvestmentContribution)}/mo) exceed your budget surplus ({ff(monthlySurplus)}/mo). Adjust your budget or contributions.
                </p>
              </div>
            )}

            {/* ─── TAX OPTIMIZATION TIPS ─────────────────────────── */}
            {country && (
              <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flex: "1 1 300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>💡</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Tax Optimization — {country.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{country.notes}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div style={{ background: "var(--surface-raised)", borderRadius: 6, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>CAPITAL GAINS TAX</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: country.capitalGainsTax === 0 ? "var(--green)" : "var(--yellow)", fontFamily: "'DM Mono', monospace" }}>{country.capitalGainsTax}%</div>
                    </div>
                    <div style={{ background: "var(--surface-raised)", borderRadius: 6, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>ANNUAL TAX DRAG</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--red)", fontFamily: "'DM Mono', monospace" }}>~{ff(totalPortfolioBalance * weightedReturn / 100 * country.capitalGainsTax / 100)}</div>
                    </div>
                  </div>
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Pension System</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{country.pensionSystem}</div>
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Official Retirement Age</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{country.retireAge}</div>
                </div>
              </div>
            )}

            {/* ─── IMPORT DATA ─────────────────────────────────────── */}
            <div
              onDragOver={(e) => { e.preventDefault(); setUploadDragging(true); }}
              onDragLeave={() => setUploadDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setUploadDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              style={{
                ...card,
                border: `2px dashed ${uploadDragging ? "var(--accent)" : "var(--border)"}`,
                background: uploadDragging ? "var(--accent-soft)" : "var(--surface)",
                textAlign: "center",
                padding: "24px 20px",
                transition: "all 0.2s",
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => {
                const inp = document.createElement("input");
                inp.type = "file";
                inp.accept = ".csv,.txt,.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls";
                inp.onchange = (e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); };
                inp.click();
              }}
            >
              {uploadParsing ? (
                <div>
                  <div style={{ display: "inline-block", width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <div style={{ color: "var(--text-muted)", marginTop: 10, fontSize: 13 }}>Parsing your document with AI...</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.6 }}>📄</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Import your financial data</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Drag & drop or click to upload a CSV, PDF, image, or text file with your budget or investment data.
                    <br />AI will parse it and populate the platform automatically.
                  </div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
                    {["CSV", "PDF", "Image", "XLSX", "TXT"].map(t => (
                      <span key={t} style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", background: "var(--surface-raised)", padding: "3px 10px", borderRadius: 6, fontFamily: "'DM Mono', monospace" }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload result toast */}
              {uploadResult && !uploadParsing && (
                <div style={{
                  marginTop: 14,
                  background: uploadResult.success ? "var(--green-soft)" : "var(--red-soft)",
                  border: `1px solid ${uploadResult.success ? "var(--green)" : "var(--red)"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  textAlign: "left",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{uploadResult.success ? "✓" : "✗"}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: uploadResult.success ? "var(--green)" : "var(--red)" }}>
                      {uploadResult.fileName}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{uploadResult.summary}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════ BUDGET ══════════════════════════════ */}
        {tab === "budget" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {/* Income */}
            {(() => {
              const incomeDrag = makeDragHandlers("income", budget.income, (items) => setBudget(prev => ({ ...prev, income: items })));
              return (
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={sectionLabel}>Income</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{ff(totalIncome)}</div>
                  </div>
                  {budget.income.map(item => (
                    <div
                      key={item.id} draggable
                      onDragStart={(e) => incomeDrag.onDragStart(e, item.id)}
                      onDragOver={(e) => incomeDrag.onDragOver(e, item.id)}
                      onDragEnd={incomeDrag.onDragEnd}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)", opacity: incomeDrag.isDragging(item.id) ? 0.4 : 1, background: incomeDrag.isOver(item.id) ? "var(--accent-soft)" : "transparent", borderRadius: incomeDrag.isOver(item.id) ? 6 : 0, transition: "all 0.15s" }}
                    >
                      <span style={dragHandle}>⠿</span>
                      <input type="text" value={item.name} onChange={(e) => updateBudgetItem("income", item.id, { ...item, name: e.target.value })}
                        style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 0 }} />
                      <input type="number" value={item.amount || 0} onChange={(e) => updateBudgetItem("income", item.id, { ...item, amount: parseFloat(e.target.value) || 0 })}
                        style={{ width: 80, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                      <button onClick={() => deleteBudgetItem("income", item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addBudgetItem("income")} style={addBtn}>+ Add income</button>
                </div>
              );
            })()}

            {/* Expenses */}
            {(() => {
              const expDrag = makeDragHandlers("expenses", budget.expenses, (items) => setBudget(prev => ({ ...prev, expenses: items })));
              return (
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={sectionLabel}>Expenses</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--red)", fontFamily: "'DM Mono', monospace" }}>{ff(totalExpenses)}</div>
                  </div>
                  {budget.expenses.map(item => (
                    <div
                      key={item.id} draggable
                      onDragStart={(e) => expDrag.onDragStart(e, item.id)}
                      onDragOver={(e) => expDrag.onDragOver(e, item.id)}
                      onDragEnd={expDrag.onDragEnd}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)", opacity: expDrag.isDragging(item.id) ? 0.4 : 1, background: expDrag.isOver(item.id) ? "var(--accent-soft)" : "transparent", borderRadius: expDrag.isOver(item.id) ? 6 : 0, transition: "all 0.15s" }}
                    >
                      <span style={dragHandle}>⠿</span>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORY_COLORS[item.category] || "#888", flexShrink: 0 }} />
                      <input type="text" value={item.name} onChange={(e) => updateBudgetItem("expenses", item.id, { ...item, name: e.target.value })}
                        style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 0 }} />
                      <select value={item.category || "lifestyle"} onChange={(e) => updateBudgetItem("expenses", item.id, { ...item, category: e.target.value })}
                        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 6px", color: "var(--text-secondary)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                        <option value="housing">Housing</option><option value="essentials">Essentials</option><option value="lifestyle">Lifestyle</option><option value="savings">Savings</option>
                      </select>
                      <input type="number" value={item.amount} onChange={(e) => updateBudgetItem("expenses", item.id, { ...item, amount: parseFloat(e.target.value) || 0 })}
                        style={{ width: 80, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                      <button onClick={() => deleteBudgetItem("expenses", item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addBudgetItem("expenses")} style={addBtn}>+ Add expense</button>
                </div>
              );
            })()}
            </div>

            {/* Summary */}
            <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", background: monthlySurplus >= 0 ? "var(--green-soft)" : "var(--red-soft)" }}>
              <div>
                <div style={sectionLabel}>Monthly Surplus</div>
                <div style={{ ...statNumber, color: monthlySurplus >= 0 ? "var(--green)" : "var(--red)" }}>{ff(monthlySurplus)}</div>
              </div>
              <div style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {monthlySurplus >= 0
                  ? `You have ${ff(monthlySurplus)} left after expenses. Currently allocating ${ff(totalInvestmentContribution)} to investments. ${monthlySurplus > totalInvestmentContribution ? `You could invest an additional ${ff(monthlySurplus - totalInvestmentContribution)}/mo.` : ""}`
                  : `You're spending ${ff(Math.abs(monthlySurplus))} more than you earn. Review your expenses or increase income.`}
              </div>
            </div>

            {/* ═══════ BUDGET VS ACTUAL ═══════ */}
            {(() => {
              const categories = ["housing", "essentials", "lifestyle", "savings"];
              const monthData = actuals[actualsMonth] || {};
              const hasActuals = Object.keys(monthData).length > 0;

              // Budget totals per category
              const budgetByCategory = {};
              categories.forEach(cat => {
                budgetByCategory[cat] = budget.expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0);
              });
              const totalBudgeted = categories.reduce((s, c) => s + (budgetByCategory[c] || 0), 0);
              const totalActual = categories.reduce((s, c) => s + (monthData[c] || 0), 0);

              // Available months for selector
              const availableMonths = [...new Set([actualsMonth, ...Object.keys(actuals)])].sort();

              // Month label
              const monthLabel = (m) => {
                const [y, mo] = m.split("-");
                return `${MONTHS[parseInt(mo, 10) - 1]} ${y}`;
              };

              return (
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📊</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Budget vs Actual</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* Month selector */}
                      <button onClick={() => {
                        const [y, m] = actualsMonth.split("-").map(Number);
                        const prev = m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,"0")}`;
                        setActualsMonth(prev);
                      }} style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>‹</button>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Mono', monospace", minWidth: 80, textAlign: "center" }}>{monthLabel(actualsMonth)}</span>
                      <button onClick={() => {
                        const [y, m] = actualsMonth.split("-").map(Number);
                        const next = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`;
                        setActualsMonth(next);
                      }} style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>›</button>

                      {/* Upload actuals */}
                      <button
                        onClick={() => {
                          const inp = document.createElement("input");
                          inp.type = "file";
                          inp.accept = ".csv,.txt,.pdf,.png,.jpg,.jpeg,.xlsx";
                          inp.onchange = (e) => { if (e.target.files[0]) handleActualsUpload(e.target.files[0]); };
                          inp.click();
                        }}
                        disabled={actualsUploading}
                        style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 8, padding: "6px 14px", color: "var(--accent)", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}
                      >
                        {actualsUploading ? "Parsing..." : "↑ Upload statement"}
                      </button>
                    </div>
                  </div>

                  {/* Category rows */}
                  <div style={{ padding: "0 20px 16px" }}>
                    {!hasActuals && (
                      <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                        <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.4 }}>📄</div>
                        No actuals for {monthLabel(actualsMonth)} yet. Upload a bank statement or transaction export, or click a category to enter manually.
                      </div>
                    )}

                    {/* Total row */}
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 80px 80px 70px", gap: "0 12px", alignItems: "center", padding: "10px 0", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 10 }}></div><div>Category</div><div style={{ textAlign: "right" }}>Budget</div><div style={{ textAlign: "right" }}>Actual</div><div style={{ textAlign: "right" }}>Diff</div>
                    </div>

                    {categories.map(cat => {
                      const budgeted = budgetByCategory[cat] || 0;
                      const actual = monthData[cat] || 0;
                      const diff = budgeted - actual;
                      const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
                      const isOver = actual > budgeted && budgeted > 0;
                      const isExpanded = actualsExpanded === cat;
                      const catItems = budget.expenses.filter(e => e.category === cat);

                      return (
                        <div key={cat}>
                          {/* Main row */}
                          <div
                            onClick={() => setActualsExpanded(isExpanded ? null : cat)}
                            style={{ display: "grid", gridTemplateColumns: "auto 1fr 80px 80px 70px", gap: "0 12px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}
                          >
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORY_COLORS[cat] || "#888" }} />
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{cat}</span>
                              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{isExpanded ? "▾" : "▸"}</span>
                            </div>
                            <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace" }}>{ff(budgeted)}</div>
                            <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: actual > 0 ? (isOver ? "var(--red)" : "var(--text-primary)") : "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
                              {actual > 0 ? ff(actual) : "—"}
                            </div>
                            <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: actual === 0 ? "var(--text-muted)" : diff >= 0 ? "var(--green)" : "var(--red)" }}>
                              {actual > 0 ? `${diff >= 0 ? "+" : ""}${ff(diff)}` : "—"}
                            </div>
                          </div>

                          {/* Progress bar */}
                          {(actual > 0 || budgeted > 0) && (
                            <div style={{ padding: "4px 0 6px 22px" }}>
                              <div style={{ height: 4, background: "var(--surface-raised)", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{
                                  height: "100%",
                                  width: `${Math.min(pct, 100)}%`,
                                  background: isOver ? "var(--red)" : pct > 80 ? "var(--yellow)" : "var(--green)",
                                  borderRadius: 2,
                                  transition: "width 0.3s",
                                }} />
                              </div>
                              {actual > 0 && <div style={{ fontSize: 9, color: isOver ? "var(--red)" : "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{pct.toFixed(0)}% of budget used</div>}
                            </div>
                          )}

                          {/* Expanded: edit actual + see line items */}
                          {isExpanded && (
                            <div style={{ padding: "8px 0 12px 22px", borderBottom: "1px solid var(--border)" }}>
                              {/* Editable actual */}
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>Actual for {monthLabel(actualsMonth)}:</span>
                                <div style={{ position: "relative", width: 120 }}>
                                  <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", pointerEvents: "none" }}>{sym}</span>
                                  <input
                                    type="number"
                                    value={monthData[cat] || ""}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setActuals(prev => ({
                                        ...prev,
                                        [actualsMonth]: { ...(prev[actualsMonth] || {}), [cat]: val }
                                      }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      width: "100%",
                                      background: "var(--surface-raised)",
                                      border: "1px solid var(--border)",
                                      borderRadius: 8,
                                      padding: "8px 8px 8px 26px",
                                      color: "var(--text-primary)",
                                      fontSize: 14,
                                      fontFamily: "'DM Mono', monospace",
                                      fontWeight: 600,
                                      outline: "none",
                                    }}
                                  />
                                </div>
                                {actual > 0 && budgeted > 0 && (
                                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: isOver ? "var(--red)" : "var(--green)" }}>
                                    {isOver ? `${ff(Math.abs(diff))} over` : `${ff(diff)} under`} budget
                                  </span>
                                )}
                              </div>

                              {/* Budget line items for context */}
                              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Budgeted line items</div>
                              {catItems.map(item => (
                                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
                                  <span style={{ color: "var(--text-secondary)" }}>{item.name}</span>
                                  <span style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{ff(item.amount)}</span>
                                </div>
                              ))}
                              {catItems.length === 0 && (
                                <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>No budget items in this category</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Total summary row */}
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 80px 80px 70px", gap: "0 12px", alignItems: "center", padding: "12px 0 4px", fontSize: 13, fontWeight: 700 }}>
                      <div style={{ width: 10 }}></div>
                      <div style={{ color: "var(--text-primary)" }}>Total</div>
                      <div style={{ textAlign: "right", color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace" }}>{ff(totalBudgeted)}</div>
                      <div style={{ textAlign: "right", color: totalActual > 0 ? "var(--text-primary)" : "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{totalActual > 0 ? ff(totalActual) : "—"}</div>
                      <div style={{ textAlign: "right", fontFamily: "'DM Mono', monospace", color: totalActual === 0 ? "var(--text-muted)" : (totalBudgeted - totalActual) >= 0 ? "var(--green)" : "var(--red)" }}>
                        {totalActual > 0 ? `${(totalBudgeted - totalActual) >= 0 ? "+" : ""}${ff(totalBudgeted - totalActual)}` : "—"}
                      </div>
                    </div>

                    {/* Overspend/underspend summary bar */}
                    {totalActual > 0 && (
                      <div style={{
                        marginTop: 10,
                        background: (totalBudgeted - totalActual) >= 0 ? "var(--green-soft)" : "var(--red-soft)",
                        border: `1px solid ${(totalBudgeted - totalActual) >= 0 ? "rgba(124,202,152,0.3)" : "rgba(232,146,124,0.3)"}`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}>
                        <span style={{ fontSize: 16 }}>{(totalBudgeted - totalActual) >= 0 ? "✓" : "⚠"}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: (totalBudgeted - totalActual) >= 0 ? "var(--green)" : "var(--red)" }}>
                            {(totalBudgeted - totalActual) >= 0
                              ? `${ff(totalBudgeted - totalActual)} under budget in ${monthLabel(actualsMonth)}`
                              : `${ff(Math.abs(totalBudgeted - totalActual))} over budget in ${monthLabel(actualsMonth)}`
                            }
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {categories.filter(c => (monthData[c] || 0) > (budgetByCategory[c] || 0) && (budgetByCategory[c] || 0) > 0).length > 0
                              ? `Overspent in: ${categories.filter(c => (monthData[c] || 0) > (budgetByCategory[c] || 0) && (budgetByCategory[c] || 0) > 0).join(", ")}`
                              : "All categories within budget"
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ═══════ SPENDING TRENDS ═══════ */}
            {Object.keys(actuals).length >= 2 && (() => {
              const months = Object.keys(actuals).sort();
              const categories = ["housing", "essentials", "lifestyle", "savings"];
              const trends = categories.map(cat => {
                const vals = months.map(m => actuals[m]?.[cat] || 0);
                const avg = vals.reduce((s,v) => s+v, 0) / vals.length;
                const last = vals[vals.length - 1];
                const prev = vals.length > 1 ? vals[vals.length - 2] : last;
                const change = prev > 0 ? ((last - prev) / prev * 100) : 0;
                return { cat, vals, avg, last, change };
              });
              const totalByMonth = months.map(m => categories.reduce((s, c) => s + (actuals[m]?.[c] || 0), 0));
              const avgTotal = totalByMonth.reduce((s,v) => s+v, 0) / totalByMonth.length;
              const lastTotal = totalByMonth[totalByMonth.length - 1];
              const totalChange = avgTotal > 0 ? ((lastTotal - avgTotal) / avgTotal * 100) : 0;

              return (
                <div style={card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 16 }}>📈</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Spending Trends</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({months.length} months of data)</span>
                  </div>

                  {/* Overall trend */}
                  <div style={{ padding: "10px 14px", background: Math.abs(totalChange) < 3 ? "var(--surface-raised)" : totalChange > 0 ? "var(--red-soft)" : "var(--green-soft)", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Overall spending is </span>
                    <strong style={{ color: totalChange > 3 ? "var(--red)" : totalChange < -3 ? "var(--green)" : "var(--text-primary)" }}>
                      {Math.abs(totalChange) < 3 ? "stable" : totalChange > 0 ? `trending up ${totalChange.toFixed(0)}%` : `trending down ${Math.abs(totalChange).toFixed(0)}%`}
                    </strong>
                    <span style={{ color: "var(--text-secondary)" }}> vs your average of {ff(avgTotal)}/mo</span>
                  </div>

                  {/* Per-category trends */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                    {trends.map((t, i) => (
                      <div key={i} style={{ background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[t.cat] || "#888" }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{t.cat}</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: Math.abs(t.change) < 5 ? "var(--text-muted)" : t.change > 0 ? "var(--red)" : "var(--green)" }}>
                            {t.change > 0 ? "▲" : t.change < 0 ? "▼" : "—"} {Math.abs(t.change).toFixed(0)}%
                          </span>
                        </div>
                        <MiniBar data={t.vals} max={Math.max(...t.vals, 1) * 1.1} color={CATEGORY_COLORS[t.cat] || "#888"} height={30} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
                          <span>Avg: {ff(t.avg)}</span>
                          <span>Last: {ff(t.last)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        {tab === "investments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Portfolio header */}
            <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
              <div>
                <div style={sectionLabel}>Total Portfolio</div>
                <div style={{ ...statNumber, color: "var(--accent)" }}>{ff(totalPortfolioBalance)}</div>
              </div>
              <div>
                <div style={sectionLabel}>Monthly Contributions</div>
                <div style={{ ...statNumber, color: "var(--green)", fontSize: 22 }}>{ff(totalInvestmentContribution)}</div>
              </div>
              <div>
                <div style={sectionLabel}>Weighted Return</div>
                <div style={{ ...statNumber, color: "var(--yellow)", fontSize: 22 }}>{weightedReturn.toFixed(1)}%</div>
              </div>
              <div>
                <div style={sectionLabel}>Accounts</div>
                <div style={{ ...statNumber, color: "var(--text-secondary)", fontSize: 22 }}>{[...new Set(investments.map(i => i.account || "other"))].length}</div>
              </div>
            </div>

            {/* Investments grouped by account */}
            {(() => {
              const invDrag = makeDragHandlers("investments", investments, setInvestments);
              const usedAccounts = [...new Set(investments.map(i => i.account || "other"))];
              const accountOrder = accounts.filter(a => usedAccounts.includes(a.id));
              const unmatched = usedAccounts.filter(u => !accounts.find(a => a.id === u));
              if (unmatched.length > 0) accountOrder.push(...unmatched.map(u => ({ id: u, name: u, icon: "📁", color: "#7CAABD" })));

              return accountOrder.map(acct => {
                const acctInvestments = investments.filter(inv => (inv.account || "other") === acct.id);
                const acctBalance = acctInvestments.reduce((s, i) => s + (i.balance || 0), 0);
                const acctContrib = acctInvestments.reduce((s, i) => s + (i.monthlyContribution || 0), 0);

                return (
                  <div key={acct.id} style={{ ...card, padding: 0, overflow: "hidden" }}>
                    {/* Account header */}
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{acct.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{acct.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{acctInvestments.length} holding{acctInvestments.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: acct.color, fontFamily: "'DM Mono', monospace" }}>{ff(acctBalance)}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{ff(acctContrib)}/mo</div>
                        </div>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: acct.color }} />
                      </div>
                    </div>

                    {/* Investment rows */}
                    <div style={{ padding: "0 20px 12px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "24px auto 1fr 80px 90px 90px 60px 70px 30px", gap: "6px 8px", alignItems: "center", fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", padding: "8px 0 4px" }}>
                        <div></div><div></div><div>Name</div><div>Ticker</div><div style={{ textAlign: "right" }}>Balance</div><div style={{ textAlign: "right" }}>Monthly</div><div style={{ textAlign: "right" }}>Ret%</div><div>Type</div><div></div>
                      </div>
                      {acctInvestments.map(inv => (
                        <div
                          key={inv.id}
                          draggable
                          onDragStart={(e) => invDrag.onDragStart(e, inv.id)}
                          onDragOver={(e) => invDrag.onDragOver(e, inv.id)}
                          onDragEnd={invDrag.onDragEnd}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "24px auto 1fr 80px 90px 90px 60px 70px 30px",
                            gap: "6px 8px",
                            alignItems: "center",
                            padding: "7px 0",
                            borderBottom: "1px solid var(--border)",
                            opacity: invDrag.isDragging(inv.id) ? 0.4 : 1,
                            background: invDrag.isOver(inv.id) ? "var(--accent-soft)" : "transparent",
                            borderRadius: invDrag.isOver(inv.id) ? 6 : 0,
                            transition: "background 0.15s, opacity 0.15s",
                          }}
                        >
                          <span style={dragHandle} title="Drag to reorder">⠿</span>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: INVESTMENT_COLORS[inv.type] || "#888" }} />
                          <input type="text" value={inv.name} onChange={(e) => updateInvestment(inv.id, { ...inv, name: e.target.value })}
                            style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 0 }} />
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <input type="text" value={inv.ticker || ""} placeholder="—"
                              onChange={(e) => updateInvestment(inv.id, { ...inv, ticker: e.target.value.toUpperCase() })}
                              style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "3px 6px", color: inv.ticker ? "var(--accent)" : "var(--text-muted)", fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 600 }} />
                            {inv.ticker && (
                              <button onClick={() => openAssetDetail(inv.ticker, inv.id)} title="View details"
                                style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 4, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "var(--accent)", fontSize: 10, fontWeight: 700 }}>→</button>
                            )}
                          </div>
                          <input type="number" value={inv.balance} onChange={(e) => updateInvestment(inv.id, { ...inv, balance: parseFloat(e.target.value) || 0 })}
                            style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "3px 6px", color: "var(--text-primary)", fontSize: 12, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                          <input type="number" value={inv.monthlyContribution} onChange={(e) => updateInvestment(inv.id, { ...inv, monthlyContribution: parseFloat(e.target.value) || 0 })}
                            style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "3px 6px", color: "var(--text-primary)", fontSize: 12, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                          <input type="number" value={inv.annualReturn} step={0.1} onChange={(e) => updateInvestment(inv.id, { ...inv, annualReturn: parseFloat(e.target.value) || 0 })}
                            style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "3px 6px", color: "var(--text-primary)", fontSize: 12, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                          <select value={inv.type} onChange={(e) => updateInvestment(inv.id, { ...inv, type: e.target.value })}
                            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "3px 4px", color: "var(--text-secondary)", fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                            <option value="stocks">Stocks</option><option value="bonds">Bonds</option><option value="crypto">Crypto</option><option value="realestate">RE</option><option value="savings">Savings</option><option value="other">Other</option>
                          </select>
                          <button onClick={() => deleteInvestment(inv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                      {/* Add investment to this account */}
                      <button onClick={() => setInvestments(prev => [...prev, { id: uid(), name: "New Investment", ticker: "", balance: 0, monthlyContribution: 0, annualReturn: 7, type: "stocks", account: acct.id }])} style={{ ...addBtn, fontSize: 11 }}>+ Add to {acct.name}</button>
                    </div>
                  </div>
                );
              });
            })()}

            {/* Manage accounts */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={sectionLabel}>Investment Accounts</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {accounts.map(acct => {
                  const acctBal = investments.filter(i => (i.account || "other") === acct.id).reduce((s, i) => s + (i.balance || 0), 0);
                  return (
                    <div key={acct.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px", border: `1px solid var(--border)` }}>
                      <span style={{ fontSize: 16 }}>{acct.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input type="text" value={acct.name} onChange={(e) => setAccounts(prev => prev.map(a => a.id === acct.id ? { ...a, name: e.target.value } : a))}
                          style={{ width: "100%", background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{ff(acctBal)}</div>
                      </div>
                      <input type="color" value={acct.color} onChange={(e) => setAccounts(prev => prev.map(a => a.id === acct.id ? { ...a, color: e.target.value } : a))}
                        style={{ width: 22, height: 22, border: "none", borderRadius: 4, cursor: "pointer", padding: 0 }} />
                      <button onClick={() => setAccounts(prev => prev.filter(a => a.id !== acct.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14 }}>×</button>
                    </div>
                  );
                })}
                <button onClick={() => setAccounts(prev => [...prev, { id: uid(), name: "New Account", icon: "📁", color: "#7CAABD" }])} style={{ ...addBtn, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52 }}>+ Add account</button>
              </div>
            </div>

            {/* Account allocation donut */}
            {(() => {
              const accountAlloc = accounts.map(a => ({
                name: a.name,
                value: investments.filter(i => (i.account || "other") === a.id).reduce((s, i) => s + (i.balance || 0), 0),
                color: a.color,
              })).filter(a => a.value > 0);

              return accountAlloc.length > 0 ? (
                <div style={{ ...card }}>
                  <div style={sectionLabel}>Balance by Account</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <DonutChart segments={accountAlloc} size={140} sym={sym} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {accountAlloc.map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color }} />
                          <span style={{ color: "var(--text-secondary)" }}>{a.name}</span>
                          <span style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{ff(a.value)}</span>
                          <span style={{ color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", fontSize: 10 }}>({totalPortfolioBalance > 0 ? ((a.value / totalPortfolioBalance) * 100).toFixed(0) : 0}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* ═══════ PORTFOLIO ALLOCATION & ANALYSIS ═══════ */}
            {(() => {
              const typeData = investmentByType;
              const total = typeData.reduce((s, t) => s + t.value, 0);
              if (total === 0) return null;

              // Compute allocation percentages
              const alloc = typeData.map(t => ({ ...t, pct: (t.value / total) * 100 }));
              const stocksPct = alloc.find(a => a.name === "stocks")?.pct || 0;
              const bondsPct = alloc.find(a => a.name === "bonds")?.pct || 0;
              const savingsPct = alloc.find(a => a.name === "savings")?.pct || 0;
              const cryptoPct = alloc.find(a => a.name === "crypto")?.pct || 0;
              const rePct = alloc.find(a => a.name === "realestate")?.pct || 0;
              const age = profile.currentAge;

              // Risk score (0-100, higher = more aggressive)
              const riskScore = Math.min(100, Math.round(stocksPct * 0.7 + cryptoPct * 1.0 + rePct * 0.5 + bondsPct * 0.2 + savingsPct * 0.05));
              const riskLabel = riskScore > 70 ? "Aggressive" : riskScore > 45 ? "Moderate" : riskScore > 20 ? "Conservative" : "Very Conservative";
              const riskColor = riskScore > 70 ? "var(--red)" : riskScore > 45 ? "var(--yellow)" : "var(--green)";

              // Age-based recommendation
              const suggestedStocks = Math.max(20, Math.min(90, 110 - age));
              const suggestedBonds = 100 - suggestedStocks;
              const isOverweightStocks = stocksPct > suggestedStocks + 15;
              const isUnderweightStocks = stocksPct < suggestedStocks - 15;

              // Concentration risk
              const maxSingleType = Math.max(...alloc.map(a => a.pct));
              const isConcentrated = maxSingleType > 75;

              // Diversification score
              const diverseCount = alloc.filter(a => a.pct > 5).length;
              const diverseScore = Math.min(100, diverseCount * 25);

              // Interpretation messages
              const insights = [];

              if (isConcentrated) {
                const top = alloc.reduce((a, b) => a.pct > b.pct ? a : b);
                insights.push({ type: "warning", icon: "⚠", text: `High concentration: ${top.pct.toFixed(0)}% in ${top.name}. Consider diversifying to reduce single-asset-class risk.` });
              }
              if (isOverweightStocks) {
                insights.push({ type: "info", icon: "📊", text: `At age ${age}, your ${stocksPct.toFixed(0)}% equities allocation is above the rule-of-thumb ${suggestedStocks}%. This is more aggressive — higher returns potential but more volatility.` });
              } else if (isUnderweightStocks) {
                insights.push({ type: "info", icon: "📊", text: `At age ${age}, your ${stocksPct.toFixed(0)}% equities allocation is below the suggested ${suggestedStocks}%. You may be leaving growth on the table.` });
              } else {
                insights.push({ type: "good", icon: "✓", text: `Your ${stocksPct.toFixed(0)}% equities allocation is well-suited for age ${age}. The classic guideline suggests ~${suggestedStocks}% stocks.` });
              }
              if (cryptoPct > 15) {
                insights.push({ type: "warning", icon: "⚡", text: `${cryptoPct.toFixed(0)}% in crypto is significant. Most advisors suggest capping crypto at 5-10% of a portfolio due to extreme volatility.` });
              }
              if (savingsPct > 30 && age < 50) {
                insights.push({ type: "info", icon: "💡", text: `${savingsPct.toFixed(0)}% in savings/cash is quite conservative for your age. Inflation (${profile.inflationRate}%) may erode this. Consider moving some into growth assets.` });
              }
              if (bondsPct === 0 && age > 40) {
                insights.push({ type: "info", icon: "🛡️", text: `No bond allocation. Bonds provide stability and income as you approach retirement. Consider adding 10-${Math.round(100 - suggestedStocks)}% in bonds.` });
              }
              if (diverseCount >= 4) {
                insights.push({ type: "good", icon: "✓", text: `Good diversification across ${diverseCount} asset classes. This spreads risk effectively.` });
              }
              if (diverseCount <= 2) {
                insights.push({ type: "warning", icon: "⚠", text: `Only ${diverseCount} asset class${diverseCount === 1 ? "" : "es"} with meaningful allocation. Diversifying across more classes reduces portfolio risk.` });
              }

              return (
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📈</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Portfolio Allocation & Analysis</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {/* Left: Allocation chart */}
                    <div style={{ flex: "1 1 320px", padding: 20, borderRight: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
                        <DonutChart segments={investmentByType} size={160} sym={sym} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {alloc.map((a, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize", minWidth: 70 }}>{a.name}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>{a.pct.toFixed(1)}%</span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{ff(a.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Horizontal stacked bar */}
                      <div style={{ height: 28, borderRadius: 6, overflow: "hidden", display: "flex", marginBottom: 12 }}>
                        {alloc.filter(a => a.pct > 0).map((a, i) => (
                          <div key={i} style={{ width: `${a.pct}%`, height: "100%", background: a.color, display: "flex", alignItems: "center", justifyContent: "center", minWidth: a.pct > 8 ? "auto" : 0, transition: "width 0.3s" }}>
                            {a.pct > 8 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: "'DM Mono', monospace", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{a.pct.toFixed(0)}%</span>}
                          </div>
                        ))}
                      </div>

                      {/* Age-based recommendation bar */}
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Suggested for age {age} (rule of thumb: {suggestedStocks}% stocks / {suggestedBonds}% bonds)</div>
                      <div style={{ height: 12, borderRadius: 4, overflow: "hidden", display: "flex", opacity: 0.5 }}>
                        <div style={{ width: `${suggestedStocks}%`, height: "100%", background: INVESTMENT_COLORS.stocks }} />
                        <div style={{ width: `${suggestedBonds}%`, height: "100%", background: INVESTMENT_COLORS.bonds }} />
                      </div>
                    </div>

                    {/* Right: Interpretation */}
                    <div style={{ flex: "1 1 300px", padding: 20 }}>
                      {/* Risk & Diversification scores */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        <div style={{ background: "var(--surface-raised)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Risk Profile</div>
                          <div style={{ fontSize: 26, fontWeight: 700, color: riskColor, fontFamily: "'DM Mono', monospace" }}>{riskScore}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: riskColor }}>{riskLabel}</div>
                          <div style={{ height: 4, background: "var(--surface)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${riskScore}%`, background: riskColor, borderRadius: 2 }} />
                          </div>
                        </div>
                        <div style={{ background: "var(--surface-raised)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Diversification</div>
                          <div style={{ fontSize: 26, fontWeight: 700, color: diverseScore > 60 ? "var(--green)" : diverseScore > 30 ? "var(--yellow)" : "var(--red)", fontFamily: "'DM Mono', monospace" }}>{diverseScore}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: diverseScore > 60 ? "var(--green)" : "var(--text-muted)" }}>{diverseCount} asset classes</div>
                          <div style={{ height: 4, background: "var(--surface)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${diverseScore}%`, background: diverseScore > 60 ? "var(--green)" : diverseScore > 30 ? "var(--yellow)" : "var(--red)", borderRadius: 2 }} />
                          </div>
                        </div>
                      </div>

                      {/* Insights */}
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Interpretation</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {insights.map((ins, i) => (
                          <div key={i} style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            lineHeight: 1.5,
                            color: "var(--text-secondary)",
                            background: ins.type === "warning" ? "var(--red-soft)" : ins.type === "good" ? "var(--green-soft)" : "var(--surface-raised)",
                            borderLeft: `3px solid ${ins.type === "warning" ? "var(--red)" : ins.type === "good" ? "var(--green)" : "var(--accent)"}`,
                          }}>
                            <span style={{ marginRight: 6 }}>{ins.icon}</span>{ins.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 12-Month Growth Projection */}
            <div style={card}>
              <div style={sectionLabel}>12-Month Growth Projection</div>
              <MiniBar data={savingsTrajectory} max={Math.max(...savingsTrajectory) * 1.1} color="var(--accent)" height={120} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Today: {ff(totalPortfolioBalance)}</span>
                <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>+{ff(savingsTrajectory[11] - totalPortfolioBalance)} growth</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ ASSET DETAIL ════════════════════════ */}
        {tab === "assetDetail" && assetView && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Back button */}
            <button
              onClick={() => { setTab("investments"); setAssetView(null); setAssetData(null); }}
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 18px", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, alignSelf: "flex-start", transition: "all 0.2s" }}
            >
              ← Back to Investments
            </button>

            {/* Loading state */}
            {assetLoading && (
              <div style={{ ...card, textAlign: "center", padding: 60 }}>
                <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ color: "var(--text-muted)", marginTop: 14, fontSize: 13 }}>
                  Fetching live data for <strong style={{ color: "var(--accent)" }}>{assetView.ticker}</strong>...
                </div>
              </div>
            )}

            {/* Error state */}
            {assetError && !assetLoading && (
              <div style={{ ...card, background: "var(--red-soft)", border: "1px solid var(--red)", textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
                <div style={{ color: "var(--red)", fontWeight: 600, fontSize: 14 }}>{assetError}</div>
                <button
                  onClick={() => openAssetDetail(assetView.ticker, assetView.investmentId)}
                  style={{ marginTop: 16, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 20px", color: "var(--text-primary)", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Asset data */}
            {assetData && !assetLoading && (() => {
              const d = assetData;
              const isPositive = (d.dayChange || 0) >= 0;
              const linkedInv = investments.find(i => i.id === assetView.investmentId);

              // Build 12-month sparkline
              const prices = d.monthlyPrices || [];
              const priceMax = Math.max(...prices, 1);
              const priceMin = Math.min(...prices, 0);
              const priceRange = priceMax - priceMin || 1;

              return (
                <>
                  {/* Hero header */}
                  <div style={{ ...card, background: "linear-gradient(135deg, var(--surface) 0%, rgba(91,141,239,0.06) 100%)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", padding: "3px 10px", borderRadius: 6, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>{d.ticker}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface-raised)", padding: "3px 8px", borderRadius: 6, fontFamily: "'DM Mono', monospace" }}>{d.assetType || "—"}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{d.exchange || ""}</span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 600, lineHeight: 1.5 }}>{d.description}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 36, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>
                          {d.currency === "USD" ? "$" : d.currency === "EUR" ? "€" : d.currency === "GBP" ? "£" : (d.currency || "")}{typeof d.currentPrice === "number" ? d.currentPrice.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isPositive ? "var(--green)" : "var(--red)", fontFamily: "'DM Mono', monospace" }}>
                          {isPositive ? "▲" : "▼"} {typeof d.dayChange === "number" ? Math.abs(d.dayChange).toFixed(2) : "—"} ({typeof d.dayChangePct === "number" ? Math.abs(d.dayChangePct).toFixed(2) : "—"}%)
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Previous close: {typeof d.previousClose === "number" ? d.previousClose.toFixed(2) : "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* 12-Month Price Chart */}
                  {prices.length > 0 && (
                    <div style={card}>
                      <div style={sectionLabel}>12-Month Price History</div>
                      <svg width="100%" height="160" viewBox="0 0 600 160" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isPositive ? "#7CCA98" : "#E8927C"} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={isPositive ? "#7CCA98" : "#E8927C"} stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                          <line key={i} x1="0" y1={10 + (1 - pct) * 130} x2="600" y2={10 + (1 - pct) * 130} stroke="var(--border)" strokeDasharray="3,3" strokeWidth="0.5" />
                        ))}
                        {/* Area */}
                        <path
                          d={prices.map((p, i) => {
                            const x = (i / (prices.length - 1)) * 600;
                            const y = 10 + (1 - (p - priceMin) / priceRange) * 130;
                            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(" ") + ` L 600 140 L 0 140 Z`}
                          fill="url(#priceGrad)"
                        />
                        {/* Line */}
                        <path
                          d={prices.map((p, i) => {
                            const x = (i / (prices.length - 1)) * 600;
                            const y = 10 + (1 - (p - priceMin) / priceRange) * 130;
                            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          }).join(" ")}
                          fill="none"
                          stroke={isPositive ? "#7CCA98" : "#E8927C"}
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        {/* Dots at start and end */}
                        {[0, prices.length - 1].map(i => {
                          const x = (i / (prices.length - 1)) * 600;
                          const y = 10 + (1 - (prices[i] - priceMin) / priceRange) * 130;
                          return <circle key={i} cx={x} cy={y} r="4" fill={isPositive ? "#7CCA98" : "#E8927C"} />;
                        })}
                        {/* Price labels */}
                        <text x="4" y={10 + (1 - (prices[0] - priceMin) / priceRange) * 130 - 8} fill="var(--text-muted)" fontSize="10" fontFamily="'DM Mono', monospace">{prices[0]?.toFixed(2)}</text>
                        <text x="596" y={10 + (1 - (prices[prices.length - 1] - priceMin) / priceRange) * 130 - 8} fill={isPositive ? "#7CCA98" : "#E8927C"} fontSize="10" fontFamily="'DM Mono', monospace" textAnchor="end">{prices[prices.length - 1]?.toFixed(2)}</text>
                      </svg>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>12 months ago</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>Today</span>
                      </div>
                    </div>
                  )}

                  {/* Key stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                    {[
                      { label: "52W High", value: d.high52w != null ? d.high52w.toFixed(2) : "—" },
                      { label: "52W Low", value: d.low52w != null ? d.low52w.toFixed(2) : "—" },
                      { label: "Market Cap", value: d.marketCap || "—" },
                      { label: "P/E Ratio", value: d.peRatio != null ? d.peRatio.toFixed(1) : "—" },
                      { label: "Dividend Yield", value: d.dividendYield != null ? d.dividendYield.toFixed(2) + "%" : "—" },
                      { label: "Expense Ratio", value: d.expenseRatio != null ? d.expenseRatio.toFixed(2) + "%" : "—" },
                      { label: "Beta", value: d.beta != null ? d.beta.toFixed(2) : "—" },
                      { label: "Volume", value: d.volume || "—" },
                      { label: "Avg Volume", value: d.avgVolume || "—" },
                      { label: "Sector", value: d.sector || "—" },
                      { label: "Industry", value: d.industry || "—" },
                      { label: "Currency", value: d.currency || "—" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Performance returns */}
                  <div style={card}>
                    <div style={sectionLabel}>Performance Returns</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 8 }}>
                      {[
                        { label: "YTD", value: d.ytdReturn },
                        { label: "1 Year", value: d.return1y },
                        { label: "3 Year", value: d.return3y },
                        { label: "5 Year", value: d.return5y },
                      ].map((r, i) => {
                        const hasVal = r.value != null;
                        const pos = hasVal && r.value >= 0;
                        return (
                          <div key={i} style={{ background: hasVal ? (pos ? "var(--green-soft)" : "var(--red-soft)") : "var(--surface-raised)", borderRadius: 10, padding: "14px 16px", textAlign: "center", border: "1px solid " + (hasVal ? (pos ? "rgba(124,202,152,0.3)" : "rgba(232,146,124,0.3)") : "var(--border)") }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{r.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: hasVal ? (pos ? "var(--green)" : "var(--red)") : "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
                              {hasVal ? `${pos ? "+" : ""}${r.value.toFixed(1)}%` : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Holdings (for ETFs/Funds) */}
                  {d.holdings && (
                    <div style={card}>
                      <div style={sectionLabel}>Top Holdings</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 4 }}>{d.holdings}</div>
                    </div>
                  )}

                  {/* Your position */}
                  {linkedInv && (
                    <div style={{ ...card, background: "linear-gradient(135deg, var(--surface) 0%, rgba(124,202,152,0.06) 100%)" }}>
                      <div style={sectionLabel}>Your Position</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Current Balance</div>
                          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{ff(linkedInv.balance)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Monthly Contribution</div>
                          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{ff(linkedInv.monthlyContribution)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Expected Annual Return</div>
                          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--yellow)", fontFamily: "'DM Mono', monospace" }}>{linkedInv.annualReturn}%</div>
                        </div>
                        {d.currentPrice && linkedInv.balance > 0 && (
                          <div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Estimated Units</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>{(linkedInv.balance / d.currentPrice).toFixed(2)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ═══════════════════ NET WORTH ═══════════════════════════ */}
        {tab === "networth" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Net Worth Hero */}
            <div style={{ ...card, background: "linear-gradient(135deg, var(--surface) 0%, rgba(91,141,239,0.06) 100%)", textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total Net Worth</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: netWorth >= 0 ? "var(--green)" : "var(--red)", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{ff(netWorth)}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 14, fontSize: 13 }}>
                <span style={{ color: "var(--green)" }}>Assets: {ff(totalAssets)}</span>
                <span style={{ color: "var(--text-muted)" }}>−</span>
                <span style={{ color: "var(--red)" }}>Liabilities: {ff(totalLiabilities)}</span>
              </div>
            </div>

            {/* Net Worth History Chart */}
            {nwHistory.length > 1 && (
              <div style={card}>
                <div style={sectionLabel}>Net Worth Over Time</div>
                <svg width="100%" height="120" viewBox="0 0 600 120" preserveAspectRatio="none">
                  {(() => {
                    const vals = nwHistory.map(h => h.value);
                    const max = Math.max(...vals), min = Math.min(...vals, 0);
                    const range = max - min || 1;
                    return <>
                      <defs><linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7CCA98" stopOpacity="0.2" /><stop offset="100%" stopColor="#7CCA98" stopOpacity="0" /></linearGradient></defs>
                      <path d={vals.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (vals.length - 1) * 600).toFixed(1)} ${(110 - ((v - min) / range) * 100).toFixed(1)}`).join(" ") + ` L 600 110 L 0 110 Z`} fill="url(#nwGrad)" />
                      <path d={vals.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (vals.length - 1) * 600).toFixed(1)} ${(110 - ((v - min) / range) * 100).toFixed(1)}`).join(" ")} fill="none" stroke="#7CCA98" strokeWidth="2.5" />
                    </>;
                  })()}
                </svg>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {/* Assets */}
              {(() => {
                const assetDrag = makeDragHandlers("assets", assets, setAssets);
                return (
                  <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={sectionLabel}>Assets (excl. portfolio)</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{ff(assets.reduce((s,a) => s + (a.value||0), 0))}</div>
                    </div>
                    {assets.map(a => (
                      <div key={a.id} draggable onDragStart={(e) => assetDrag.onDragStart(e, a.id)} onDragOver={(e) => assetDrag.onDragOver(e, a.id)} onDragEnd={assetDrag.onDragEnd}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)", opacity: assetDrag.isDragging(a.id) ? 0.4 : 1, background: assetDrag.isOver(a.id) ? "var(--accent-soft)" : "transparent", borderRadius: assetDrag.isOver(a.id) ? 6 : 0, transition: "all 0.15s" }}>
                        <span style={dragHandle}>⠿</span>
                        <input type="text" value={a.name} onChange={e => setAssets(p => p.map(x => x.id === a.id ? {...x, name: e.target.value} : x))} style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                        <select value={a.category} onChange={e => setAssets(p => p.map(x => x.id === a.id ? {...x, category: e.target.value} : x))} style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 6px", color: "var(--text-secondary)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                          <option value="property">Property</option><option value="vehicle">Vehicle</option><option value="cash">Cash</option><option value="other">Other</option>
                        </select>
                        <input type="number" value={a.value} onChange={e => setAssets(p => p.map(x => x.id === a.id ? {...x, value: parseFloat(e.target.value)||0} : x))} style={{ width: 100, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                        <button onClick={() => setAssets(p => p.filter(x => x.id !== a.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}>×</button>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "6px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                      <span>Investment Portfolio (auto)</span><span style={{ fontFamily: "'DM Mono', monospace" }}>{ff(totalPortfolioBalance)}</span>
                    </div>
                    <button onClick={() => setAssets(p => [...p, {id: uid(), name: "New Asset", value: 0, category: "other"}])} style={addBtn}>+ Add asset</button>
                  </div>
                );
              })()}

              {/* Liabilities */}
              {(() => {
                const liabDrag = makeDragHandlers("liabilities", liabilities, setLiabilities);
                return (
                  <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={sectionLabel}>Liabilities</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--red)", fontFamily: "'DM Mono', monospace" }}>{ff(totalLiabilities)}</div>
                    </div>
                    {liabilities.map(l => (
                      <div key={l.id} draggable onDragStart={(e) => liabDrag.onDragStart(e, l.id)} onDragOver={(e) => liabDrag.onDragOver(e, l.id)} onDragEnd={liabDrag.onDragEnd}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)", opacity: liabDrag.isDragging(l.id) ? 0.4 : 1, background: liabDrag.isOver(l.id) ? "var(--accent-soft)" : "transparent", borderRadius: liabDrag.isOver(l.id) ? 6 : 0, transition: "all 0.15s" }}>
                        <span style={dragHandle}>⠿</span>
                        <input type="text" value={l.name} onChange={e => setLiabilities(p => p.map(x => x.id === l.id ? {...x, name: e.target.value} : x))} style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                        <input type="number" value={l.value} onChange={e => setLiabilities(p => p.map(x => x.id === l.id ? {...x, value: parseFloat(e.target.value)||0} : x))} style={{ width: 90, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                        <input type="number" value={l.monthlyPayment} placeholder="mo" onChange={e => setLiabilities(p => p.map(x => x.id === l.id ? {...x, monthlyPayment: parseFloat(e.target.value)||0} : x))} style={{ width: 70, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-primary)", fontSize: 12, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                        <input type="number" value={l.rate} step={0.1} placeholder="%" onChange={e => setLiabilities(p => p.map(x => x.id === l.id ? {...x, rate: parseFloat(e.target.value)||0} : x))} style={{ width: 55, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-primary)", fontSize: 12, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                        <button onClick={() => setLiabilities(p => p.filter(x => x.id !== l.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}>×</button>
                      </div>
                    ))}
                <button onClick={() => setLiabilities(p => [...p, {id: uid(), name: "New Debt", value: 0, monthlyPayment: 0, rate: 0}])} style={addBtn}>+ Add liability</button>

                {/* Debt Payoff Engine */}
                {liabilities.length > 0 && totalLiabilities > 0 && (
                  <div style={{ marginTop: 14, padding: 14, background: "var(--surface-raised)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Debt Payoff Strategy</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {["avalanche", "snowball"].map(s => (
                          <button key={s} onClick={() => setDebtStrategy(s)} style={{ background: debtStrategy === s ? "var(--accent-soft)" : "transparent", border: `1px solid ${debtStrategy === s ? "var(--accent)" : "var(--border)"}`, borderRadius: 6, padding: "3px 10px", color: debtStrategy === s ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", textTransform: "capitalize" }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Extra monthly payment:</span>
                      <input type="number" value={debtExtra} onChange={e => setDebtExtra(parseFloat(e.target.value)||0)} style={{ width: 80, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text-primary)", fontSize: 12, fontFamily: "'DM Mono', monospace", textAlign: "right" }} />
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                      <div><span style={{ color: "var(--text-muted)" }}>Debt-free in: </span><strong style={{ color: "var(--green)" }}>{debtPayoff.months < 600 ? `${Math.floor(debtPayoff.months/12)}y ${debtPayoff.months%12}mo` : "∞"}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Interest paid: </span><strong style={{ color: "var(--red)" }}>{ff(debtPayoff.totalInterest)}</strong></div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
                      {debtStrategy === "avalanche" ? "Highest interest rate first — saves the most money" : "Smallest balance first — quick psychological wins"}
                    </div>
                  </div>
                )}
              </div>
                );
              })()}
            </div>

            {/* Cash Flow Calendar */}
            <div style={card}>
              <div style={sectionLabel}>Monthly Cash Flow Calendar</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 8 }}>
                {cashFlowWeeks.map((w, i) => (
                  <div key={i} style={{ background: "var(--surface-raised)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Week {w.week}</div>
                    {w.income > 0 && <div style={{ fontSize: 11, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>+{ff(w.income)}</div>}
                    <div style={{ fontSize: 11, color: "var(--red)", fontFamily: "'DM Mono', monospace" }}>-{ff(w.expenses)}</div>
                    <div style={{ width: "100%", height: 3, background: "var(--surface)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, (w.balance / (totalIncome * 0.5)) * 100))}%`, background: w.balance >= 0 ? "var(--green)" : "var(--red)", borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: w.balance >= 0 ? "var(--green)" : "var(--red)", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{ff(w.balance)}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, fontStyle: "italic" }}>Assumes bi-monthly pay (1st & 15th) with expenses spread evenly. Adjust your budget to see changes.</div>
            </div>
          </div>
        )}

        {/* ═══════════════════ GOALS ═══════════════════════════════ */}
        {tab === "goals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(() => {
              const goalDrag = makeDragHandlers("goals", goals, setGoals);
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {goals.map(g => {
                const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
                const remaining = Math.max(0, g.target - g.saved);
                const deadlineDate = g.deadline ? new Date(g.deadline + "-01") : null;
                const monthsLeft = deadlineDate ? Math.max(0, Math.round((deadlineDate - new Date()) / (30.44 * 24 * 60 * 60 * 1000))) : null;
                const monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;
                return (
                  <div key={g.id} draggable onDragStart={(e) => goalDrag.onDragStart(e, g.id)} onDragOver={(e) => goalDrag.onDragOver(e, g.id)} onDragEnd={goalDrag.onDragEnd}
                    style={{ ...card, position: "relative", overflow: "hidden", opacity: goalDrag.isDragging(g.id) ? 0.4 : 1, outline: goalDrag.isOver(g.id) ? "2px solid var(--accent)" : "none", transition: "all 0.15s" }}>
                    {/* Progress bg */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, width: `${pct}%`, height: 4, background: pct >= 100 ? "var(--green)" : "var(--accent)", transition: "width 0.3s" }} />

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ ...dragHandle, opacity: 0.3, cursor: "grab" }}>⠿</span>
                        <span style={{ fontSize: 22 }}>{g.icon}</span>
                        <input type="text" value={g.name} onChange={e => setGoals(p => p.map(x => x.id === g.id ? {...x, name: e.target.value} : x))} style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" }} />
                      </div>
                      <button onClick={() => setGoals(p => p.filter(x => x.id !== g.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14 }}>×</button>
                    </div>

                    {/* Progress ring */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="var(--surface-raised)" strokeWidth="6" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke={pct >= 100 ? "var(--green)" : "var(--accent)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct * 1.76} 176`} transform="rotate(-90 32 32)" />
                        <text x="32" y="35" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="700" fontFamily="'DM Mono', monospace">{pct.toFixed(0)}%</text>
                      </svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{ff(g.saved)} of {ff(g.target)}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{ff(remaining)} remaining</div>
                        {monthlyNeeded && <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>{ff(monthlyNeeded)}/mo to hit deadline</div>}
                      </div>
                    </div>

                    {/* Editable fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: 2 }}>Target</div>
                        <input type="number" value={g.target} onChange={e => setGoals(p => p.map(x => x.id === g.id ? {...x, target: parseFloat(e.target.value)||0} : x))} style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: 2 }}>Saved</div>
                        <input type="number" value={g.saved} onChange={e => setGoals(p => p.map(x => x.id === g.id ? {...x, saved: parseFloat(e.target.value)||0} : x))} style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: 2 }}>Deadline</div>
                        <input type="month" value={g.deadline} onChange={e => setGoals(p => p.map(x => x.id === g.id ? {...x, deadline: e.target.value} : x))} style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text-primary)", fontSize: 12, fontFamily: "'DM Mono', monospace" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: 2 }}>Icon</div>
                        <select value={g.icon} onChange={e => setGoals(p => p.map(x => x.id === g.id ? {...x, icon: e.target.value} : x))} style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text-primary)", fontSize: 16 }}>
                          {["🛡️","🏠","🚗","✈️","💍","🎓","👶","💻","🏖️","💰","🎯","⭐"].map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add goal card */}
              <div onClick={() => setGoals(p => [...p, {id: uid(), name: "New Goal", target: 10000, saved: 0, deadline: "", icon: "🎯"}])} style={{ ...card, border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: 200, transition: "all 0.2s" }}>
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>+</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Add a goal</div>
                </div>
              </div>
              </div>
              );
            })()}

            {/* Goals summary */}
            {goals.length > 0 && (
              <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={sectionLabel}>Total Goal Progress</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{ff(goals.reduce((s,g) => s + g.saved, 0))} <span style={{ fontSize: 14, color: "var(--text-muted)" }}>/ {ff(goals.reduce((s,g) => s + g.target, 0))}</span></div>
                </div>
                <div>
                  <div style={sectionLabel}>Total Remaining</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--yellow)", fontFamily: "'DM Mono', monospace" }}>{ff(goals.reduce((s,g) => s + Math.max(0, g.target - g.saved), 0))}</div>
                </div>
                <div>
                  <div style={sectionLabel}>Goals Complete</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{goals.filter(g => g.saved >= g.target).length} / {goals.length}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ RETIREMENT ══════════════════════════ */}
        {tab === "retirement" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Profile inputs */}
            <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {[
                { label: "Current Age", key: "currentAge", min: 18, max: 80, step: 1 },
                { label: `Retirement Spending (${sym}/mo, today's value)`, key: "retireSpend", min: 500, max: 20000, step: 100 },
                { label: "Life Expectancy", key: "lifeExpectancy", min: 60, max: 110, step: 1 },
                { label: "Inflation Rate (%)", key: "inflationRate", min: 0, max: 10, step: 0.1 },
                { label: "Tax Rate on Withdrawals (%)", key: "taxRate", min: 0, max: 50, step: 1 },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ ...sectionLabel, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input
                    type="number" value={profile[f.key]} min={f.min} max={f.max} step={f.step}
                    onChange={(e) => setProfile(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))}
                    style={{ width: "100%", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 16, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}
                  />
                </div>
              ))}
            </div>

            {/* Big result */}
            <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, var(--surface) 0%, rgba(124,202,152,0.06) 100%)" }}>
              {projection.yearsToRetire !== null ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>You can retire at age</div>
                  <div style={{ fontSize: 64, fontWeight: 700, color: "var(--green)", lineHeight: 1 }}>{projection.retireAge}</div>
                  <div style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 8 }}>
                    That's <strong style={{ color: "var(--green)" }}>{projection.yearsToRetire} years</strong> from now · Portfolio will be <strong style={{ color: "var(--accent)" }}>{ff(projection.data.find(d => d.age === projection.retireAge)?.value || 0)}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                    Based on the 4% safe withdrawal rule · {ff(profile.retireSpend)}/mo spending in today's {sym} · {weightedReturn.toFixed(1)}% weighted portfolio return · {profile.inflationRate}% inflation
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Retirement Outlook</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: "var(--yellow)", lineHeight: 1.2 }}>Not Yet Achievable</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}>
                    With current contributions of {ff(totalInvestmentContribution)}/mo and a target spend of {ff(profile.retireSpend)}/mo, your portfolio won't reach the required nest egg before age {profile.lifeExpectancy}. Try increasing contributions or lowering retirement spending.
                  </div>
                </>
              )}
            </div>

            {/* Projection chart */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={sectionLabel}>Wealth Trajectory</div>
                <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                  <span style={{ color: "var(--accent)" }}>━━ Portfolio value</span>
                  <span style={{ color: "var(--green)" }}>┅┅ Retirement threshold</span>
                </div>
              </div>
              <ProjectionChart data={projection.data} retireAge={projection.retireAge} height={260} sym={sym} />
            </div>

            {/* ─── FIRE VARIANTS ──────────────────────────────────── */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔥</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>FIRE Pathways</span>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[
                    { key: "traditional", label: "Traditional" },
                    { key: "coast", label: "Coast" },
                    { key: "barista", label: "Barista" },
                    { key: "lean", label: "Lean" },
                    { key: "fat", label: "Fat" },
                  ].map(m => (
                    <button key={m.key} onClick={() => setFireMode(m.key)} style={{
                      background: fireMode === m.key ? "var(--accent-soft)" : "var(--surface-raised)",
                      border: `1px solid ${fireMode === m.key ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 6, padding: "4px 10px", color: fireMode === m.key ? "var(--accent)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace"
                    }}>{m.label}</button>
                  ))}
                </div>
              </div>

              {/* Comparison cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Traditional", age: fireCalc.traditional?.age, desc: "Full retirement", color: "var(--accent)" },
                  { label: "Coast FIRE", age: fireCalc.coast?.age, desc: "Stop contributing", color: "#F0C75E" },
                  { label: "Barista FIRE", age: fireCalc.barista?.age, desc: `${ff(baristaIncome)}/mo part-time`, color: "#E8927C" },
                  { label: "Lean FIRE", age: fireCalc.lean?.age, desc: `${ff(leanSpend)}/mo spend`, color: "#7CAABD" },
                  { label: "Fat FIRE", age: fireCalc.fat?.age, desc: `${ff(fatSpend)}/mo spend`, color: "#C09BD8" },
                ].map((f, i) => (
                  <div key={i} style={{ background: "var(--surface-raised)", borderRadius: 10, padding: 12, textAlign: "center", border: `1px solid ${f.label.toLowerCase().includes(fireMode) ? f.color : "var(--border)"}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: f.color, fontFamily: "'DM Mono', monospace" }}>{f.age}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{f.desc}</div>
                  </div>
                ))}
              </div>

              {/* Mode-specific inputs */}
              {fireMode === "barista" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Part-time monthly income:</span>
                  <input type="number" value={baristaIncome} onChange={e => setBaristaIncome(parseFloat(e.target.value)||0)} style={{ width: 100, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>This covers living expenses while your portfolio grows untouched.</span>
                </div>
              )}
              {fireMode === "lean" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Lean monthly spend:</span>
                  <input type="number" value={leanSpend} onChange={e => setLeanSpend(parseFloat(e.target.value)||0)} style={{ width: 100, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Minimal lifestyle — covers essentials only.</span>
                </div>
              )}
              {fireMode === "fat" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Fat monthly spend:</span>
                  <input type="number" value={fatSpend} onChange={e => setFatSpend(parseFloat(e.target.value)||0)} style={{ width: 100, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Mono', monospace" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Comfortable lifestyle — travel, dining, hobbies.</span>
                </div>
              )}
              {fireMode === "coast" && (
                <div style={{ padding: "10px 0", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {fireCalc.coast?.canCoast
                    ? `If you stopped contributing today, your portfolio of ${ff(totalPortfolioBalance)} would compound at ${weightedReturn.toFixed(1)}% and hit your retirement target by age ${fireCalc.coast.age}. You could switch to a lower-paying job you enjoy.`
                    : `Your current portfolio of ${ff(totalPortfolioBalance)} isn't large enough to coast to retirement on compounding alone. Keep contributing to reach Coast FIRE.`
                  }
                </div>
              )}
            </div>

            {/* ─── QUICK BOOST CALCULATOR ─────────────────────────── */}
            {(() => {
              const extraVal = parseFloat(boostAmount) || 0;
              const isOneTime = boostMode === "onetime";
              const isTheoretical = boostMode === "theoretical";
              const boostAge = extraVal > 0
                ? (isOneTime ? computeRetireAgeOneTime(extraVal) : computeRetireAge(totalInvestmentContribution + extraVal))
                : projection.retireAge;
              const yearsSaved = projection.retireAge - boostAge;
              const daysSaved = yearsSaved * 365;
              const monthsSaved = yearsSaved * 12;
              const hasInput = extraVal > 0;
              const isSignificant = yearsSaved > 0;

              // Portfolio at retirement with boost
              const boostPortfolioAtRetire = (() => {
                const mr = weightedReturn / 100 / 12;
                let bal = totalPortfolioBalance + (isOneTime ? extraVal : 0);
                const years = boostAge - profile.currentAge;
                const monthlyExtra = isOneTime ? 0 : extraVal;
                for (let y = 0; y < years; y++) {
                  for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + totalInvestmentContribution + monthlyExtra;
                }
                return bal;
              })();

              const extraTotalContrib = isOneTime ? extraVal : extraVal * (boostAge > profile.currentAge ? (boostAge - profile.currentAge) * 12 : 0);

              const modeBtn = (mode, label, icon) => ({
                background: boostMode === mode ? "var(--accent-soft)" : "var(--surface-raised)",
                border: `1px solid ${boostMode === mode ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "6px 14px",
                color: boostMode === mode ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              });

              // Handle add-to-portfolio
              const handleAddToPortfolio = () => {
                if (isTheoretical || !hasInput) return;
                if (boostTarget === "proportional") {
                  const totalContrib = totalInvestmentContribution || 1;
                  setInvestments(prev => prev.map(inv => {
                    const share = totalContrib > 0 ? (inv.monthlyContribution / totalContrib) : (1 / prev.length);
                    if (isOneTime) {
                      return { ...inv, balance: Math.round((inv.balance + extraVal * share) * 100) / 100 };
                    }
                    return { ...inv, monthlyContribution: Math.round((inv.monthlyContribution + extraVal * share) * 100) / 100 };
                  }));
                } else {
                  setInvestments(prev => prev.map(inv => {
                    if (inv.id !== boostTarget) return inv;
                    if (isOneTime) return { ...inv, balance: Math.round((inv.balance + extraVal) * 100) / 100 };
                    return { ...inv, monthlyContribution: Math.round((inv.monthlyContribution + extraVal) * 100) / 100 };
                  }));
                }
                setBoostAdded(true);
              };

              return (
                <div style={{
                  background: "var(--surface)",
                  border: `1px solid ${isSignificant && hasInput ? "rgba(124,202,152,0.4)" : "var(--border)"}`,
                  borderRadius: 14,
                  padding: 0,
                  overflow: "hidden",
                  transition: "border-color 0.3s",
                }}>
                  {/* Header bar */}
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>⚡</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Quick Boost Calculator</span>
                    </div>
                    {/* Mode toggle */}
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => { setBoostMode("recurring"); setBoostAdded(false); }} style={modeBtn("recurring")}>↻ Recurring</button>
                      <button onClick={() => { setBoostMode("onetime"); setBoostAdded(false); }} style={modeBtn("onetime")}>◎ One-time</button>
                      <button onClick={() => { setBoostMode("theoretical"); setBoostAdded(false); }} style={modeBtn("theoretical")}>◇ Theoretical</button>
                    </div>
                  </div>

                  {/* Mode description */}
                  <div style={{ padding: "10px 20px 0", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                    {boostMode === "recurring" && "Add a recurring monthly amount to your contributions — compounds over time."}
                    {boostMode === "onetime" && "Model a one-time lump sum injection into your portfolio — e.g., bonus, inheritance, or windfall."}
                    {boostMode === "theoretical" && "Explore hypothetical scenarios without changing your actual portfolio."}
                  </div>

                  <div style={{ padding: "16px 20px 20px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
                    {/* Input side */}
                    <div style={{ flex: "1 1 280px", minWidth: 220 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", display: "block", marginBottom: 8 }}>
                        {isOneTime ? "Lump sum amount" : "Extra monthly investment"}
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", pointerEvents: "none" }}>{sym}</span>
                          <input
                            type="number"
                            value={boostAmount}
                            placeholder="0"
                            min="0"
                            step={isOneTime ? "1000" : "50"}
                            onChange={(e) => { setBoostAmount(e.target.value); setBoostAdded(false); }}
                            style={{
                              width: "100%",
                              background: "var(--surface-raised)",
                              border: `2px solid ${hasInput && isSignificant ? "var(--green)" : "var(--border)"}`,
                              borderRadius: 12,
                              padding: "14px 14px 14px 38px",
                              color: "var(--text-primary)",
                              fontSize: 24,
                              fontFamily: "'DM Mono', monospace",
                              fontWeight: 700,
                              outline: "none",
                              transition: "border-color 0.2s",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {isOneTime ? "once" : "/ month"}
                        </span>
                      </div>

                      {/* Quick presets */}
                      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                        {(isOneTime ? [1000, 5000, 10000, 25000, 50000] : [50, 100, 200, 500, 1000]).map(v => (
                          <button
                            key={v}
                            onClick={() => { setBoostAmount(String(v)); setBoostAdded(false); }}
                            style={{
                              background: extraVal === v ? "var(--accent-soft)" : "var(--surface-raised)",
                              border: `1px solid ${extraVal === v ? "var(--accent)" : "var(--border)"}`,
                              borderRadius: 8,
                              padding: "5px 12px",
                              color: extraVal === v ? "var(--accent)" : "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: "'DM Mono', monospace",
                              transition: "all 0.15s",
                            }}
                          >
                            +{isOneTime ? f(v) : `${sym}${v}`}
                          </button>
                        ))}
                      </div>

                      {/* Allocation target dropdown */}
                      {!isTheoretical && hasInput && isSignificant && (
                        <div style={{ marginTop: 14 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", display: "block", marginBottom: 6 }}>
                            Allocate to
                          </label>
                          <select
                            value={boostTarget}
                            onChange={(e) => { setBoostTarget(e.target.value); setBoostAdded(false); }}
                            style={{
                              width: "100%",
                              background: "var(--surface-raised)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              padding: "10px 12px",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 600,
                              cursor: "pointer",
                              appearance: "none",
                              WebkitAppearance: "none",
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235E6882'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 12px center",
                              paddingRight: 30,
                            }}
                          >
                            <option value="proportional">Distribute proportionally across all</option>
                            {investments.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name}{inv.ticker ? ` (${inv.ticker})` : ""} — {ff(inv.balance)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Add to portfolio button */}
                      {hasInput && isSignificant && !isTheoretical && (
                        <button
                          onClick={handleAddToPortfolio}
                          disabled={boostAdded}
                          style={{
                            marginTop: 12,
                            width: "100%",
                            background: boostAdded ? "var(--green-soft)" : "var(--green)",
                            border: boostAdded ? "1px solid var(--green)" : "none",
                            borderRadius: 10,
                            padding: "12px 20px",
                            color: boostAdded ? "var(--green)" : "#0C0F14",
                            cursor: boostAdded ? "default" : "pointer",
                            fontSize: 14,
                            fontWeight: 700,
                            fontFamily: "'DM Sans', sans-serif",
                            transition: "all 0.2s",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {boostAdded
                            ? "✓ Added to your portfolio"
                            : isOneTime
                              ? `Add ${ff(extraVal)} lump sum to my portfolio →`
                              : `Add ${ff(extraVal)}/mo to my portfolio →`
                          }
                        </button>
                      )}
                      {isTheoretical && hasInput && isSignificant && (
                        <div style={{ marginTop: 12, background: "rgba(240,199,94,0.1)", border: "1px solid rgba(240,199,94,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "var(--yellow)" }}>
                          Theoretical mode — no changes will be made to your portfolio
                        </div>
                      )}
                      {boostAdded && (
                        <div style={{ fontSize: 11, color: "var(--green)", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>
                          {boostTarget === "proportional"
                            ? "Distributed proportionally across your investments."
                            : `Added to ${investments.find(i => i.id === boostTarget)?.name || "investment"}.`
                          } Check the Investments tab.
                        </div>
                      )}
                    </div>

                    {/* Results side */}
                    <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                      {!hasInput ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 160, color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>
                          <div>
                            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🎯</div>
                            {isOneTime
                              ? "Enter a lump sum to see how it shifts your retirement date"
                              : "Type an amount to see how much closer it brings your retirement"
                            }
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {/* Big headline result */}
                          <div style={{ textAlign: "center", padding: "10px 0" }}>
                            {isSignificant ? (
                              <>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                  {isTheoretical ? "Theoretically retire" : "You'd retire"}
                                </div>
                                <div style={{ fontSize: 48, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{yearsSaved} {yearsSaved === 1 ? "year" : "years"}</div>
                                <div style={{ fontSize: 14, color: "var(--green)", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>earlier</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginTop: 10, fontFamily: "'DM Mono', monospace" }}>
                                  Age {projection.retireAge} → Age {boostAge}
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>Impact</div>
                                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--yellow)", fontFamily: "'DM Mono', monospace", lineHeight: 1.2 }}>{"< 1 year"}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Try a larger amount to see a meaningful shift</div>
                              </>
                            )}
                          </div>

                          {/* Mini stat chips */}
                          {isSignificant && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <div style={{ background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Days of freedom gained</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{daysSaved.toLocaleString()}</div>
                              </div>
                              <div style={{ background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Months of freedom gained</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{monthsSaved.toLocaleString()}</div>
                              </div>
                              <div style={{ background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{isOneTime ? "Lump sum invested" : "Total extra invested"}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{f(extraTotalContrib)}</div>
                              </div>
                              <div style={{ background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Portfolio at retirement</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{f(boostPortfolioAtRetire)}</div>
                              </div>
                            </div>
                          )}

                          {/* Visual comparison bar */}
                          {isSignificant && (
                            <div style={{ background: "var(--surface-raised)", borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--text-muted)", marginBottom: 3 }}>
                                    <span>Current path</span>
                                    <span>Age {projection.retireAge}</span>
                                  </div>
                                  <div style={{ height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: "100%", background: "var(--text-muted)", borderRadius: 4, opacity: 0.4 }} />
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--green)", marginBottom: 3 }}>
                                    <span>With {isOneTime ? ff(extraVal) + " lump sum" : "+" + ff(extraVal) + "/mo"}</span>
                                    <span>Age {boostAge}</span>
                                  </div>
                                  <div style={{ height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{
                                      height: "100%",
                                      width: `${Math.max(10, ((boostAge - profile.currentAge) / Math.max(1, projection.retireAge - profile.currentAge)) * 100)}%`,
                                      background: "linear-gradient(90deg, var(--green), rgba(124,202,152,0.6))",
                                      borderRadius: 4,
                                      transition: "width 0.4s ease",
                                    }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ─── FREEDOM ACCELERATOR — trade-off engine ─── */}
            {(() => {
              // Precompute a range of extra-invest scenarios
              const extraSteps = [0, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000];
              const scenarioData = extraSteps.map(extra => ({
                extra,
                retireAge: computeRetireAge(totalInvestmentContribution + extra),
              }));
              const baseAge = projection.retireAge;

              // Common budget trade-offs for the trade-off cards
              const tradeoffs = [
                { emoji: "☕", name: "Daily coffee", monthly: 120, desc: "Skip the café latte" },
                { emoji: "🍕", name: "Dining out", monthly: 200, desc: "Cook at home instead" },
                { emoji: "📺", name: "Streaming", monthly: 45, desc: "Cut subscriptions" },
                { emoji: "🛍️", name: "Impulse shopping", monthly: 150, desc: "30-day buy rule" },
                { emoji: "🚗", name: "Car downgrade", monthly: 300, desc: "Switch to cheaper transport" },
                { emoji: "🏠", name: "Housing hack", monthly: 500, desc: "Downsize or get a roommate" },
                { emoji: "👔", name: "Clothing budget", monthly: 80, desc: "Capsule wardrobe" },
                { emoji: "🎮", name: "Entertainment", monthly: 100, desc: "Free alternatives" },
              ].map(t => ({
                ...t,
                retireAge: computeRetireAge(totalInvestmentContribution + t.monthly),
                yearsSaved: baseAge - computeRetireAge(totalInvestmentContribution + t.monthly),
              })).filter(t => t.yearsSaved >= 0);

              // Best combo: pick top 3 non-overlapping
              const sortedTrades = [...tradeoffs].sort((a, b) => b.yearsSaved - a.yearsSaved);
              const topCombo = sortedTrades.slice(0, 3);
              const comboMonthly = topCombo.reduce((s, t) => s + t.monthly, 0);
              const comboAge = computeRetireAge(totalInvestmentContribution + comboMonthly);
              const comboSaved = baseAge - comboAge;

              return (
                <div style={{ ...card, background: "linear-gradient(135deg, var(--surface) 0%, rgba(124,202,152,0.04) 50%, rgba(240,199,94,0.04) 100%)", padding: 0, overflow: "hidden" }}>
                  {/* Section header */}
                  <div style={{ padding: "20px 20px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>🚀</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Freedom Accelerator</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                      Every euro you redirect from spending to investing buys back time. Drag the slider to see how much earlier you could be free.
                    </p>
                  </div>

                  {/* ── Visual timeline ── */}
                  <div style={{ padding: "20px 20px 0" }}>
                    <div style={{ position: "relative", height: 80, marginBottom: 8 }}>
                      {/* Track */}
                      <div style={{ position: "absolute", top: 34, left: 0, right: 0, height: 6, background: "var(--surface-raised)", borderRadius: 3 }} />
                      {/* Filled portion up to base */}
                      <div style={{ position: "absolute", top: 34, left: 0, width: `${Math.min(100, ((baseAge - profile.currentAge) / (profile.lifeExpectancy - profile.currentAge)) * 100)}%`, height: 6, background: "var(--border)", borderRadius: 3 }} />

                      {/* Scenario markers */}
                      {scenarioData.filter(s => s.extra > 0 && s.retireAge < baseAge).map((s, i) => {
                        const pct = ((s.retireAge - profile.currentAge) / (profile.lifeExpectancy - profile.currentAge)) * 100;
                        return (
                          <div key={i} style={{ position: "absolute", top: 30, left: `${pct}%`, transform: "translateX(-50%)" }}>
                            <div style={{ width: 2, height: 14, background: "rgba(124,202,152,0.3)", margin: "0 auto" }} />
                          </div>
                        );
                      })}

                      {/* Base retirement marker */}
                      {(() => {
                        const basePct = ((baseAge - profile.currentAge) / (profile.lifeExpectancy - profile.currentAge)) * 100;
                        return (
                          <div style={{ position: "absolute", left: `${basePct}%`, top: 0, transform: "translateX(-50%)", textAlign: "center" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>CURRENT</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace" }}>{baseAge}</div>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--text-muted)", border: "2px solid var(--surface)", margin: "4px auto 0" }} />
                          </div>
                        );
                      })()}

                      {/* Best scenario marker */}
                      {scenarioData.length > 1 && scenarioData[scenarioData.length - 1].retireAge < baseAge && (() => {
                        const best = scenarioData[scenarioData.length - 1];
                        const bestPct = ((best.retireAge - profile.currentAge) / (profile.lifeExpectancy - profile.currentAge)) * 100;
                        const saved = baseAge - best.retireAge;
                        return (
                          <div style={{ position: "absolute", left: `${bestPct}%`, top: 0, transform: "translateX(-50%)", textAlign: "center" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>MAX BOOST</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace" }}>{best.retireAge}</div>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--green)", border: "2px solid var(--surface)", margin: "4px auto 0", boxShadow: "0 0 10px rgba(124,202,152,0.5)" }} />
                          </div>
                        );
                      })()}

                      {/* Arrow between them */}
                      {scenarioData.length > 1 && scenarioData[scenarioData.length - 1].retireAge < baseAge && (() => {
                        const best = scenarioData[scenarioData.length - 1];
                        const bestPct = ((best.retireAge - profile.currentAge) / (profile.lifeExpectancy - profile.currentAge)) * 100;
                        const basePct = ((baseAge - profile.currentAge) / (profile.lifeExpectancy - profile.currentAge)) * 100;
                        return (
                          <div style={{ position: "absolute", top: 32, left: `${bestPct}%`, width: `${basePct - bestPct}%`, height: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ height: 3, flex: 1, background: "linear-gradient(90deg, var(--green), rgba(124,202,152,0.2))", borderRadius: 2 }} />
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace", padding: "0 6px", whiteSpace: "nowrap" }}>up to {baseAge - best.retireAge}y earlier</span>
                          </div>
                        );
                      })()}

                      {/* Now marker */}
                      <div style={{ position: "absolute", left: 0, top: 28 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>Now ({profile.currentAge})</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Spend-to-Freedom Trade-off Cards ── */}
                  <div style={{ padding: "12px 20px 20px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
                      What if you redirected spending to investing?
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 8 }}>
                      {tradeoffs.map((t, i) => {
                        const saved = t.yearsSaved;
                        const intensity = Math.min(1, saved / 6);
                        return (
                          <div key={i} style={{
                            background: saved > 0 ? `rgba(124,202,152,${0.04 + intensity * 0.1})` : "var(--surface-raised)",
                            border: `1px solid ${saved > 0 ? `rgba(124,202,152,${0.2 + intensity * 0.3})` : "var(--border)"}`,
                            borderRadius: 10,
                            padding: "12px 12px 10px",
                            cursor: "default",
                            transition: "all 0.2s",
                            position: "relative",
                            overflow: "hidden",
                          }}>
                            {/* Progress fill bar at bottom */}
                            {saved > 0 && (
                              <div style={{ position: "absolute", bottom: 0, left: 0, width: `${Math.min(100, (saved / 8) * 100)}%`, height: 3, background: "var(--green)", borderRadius: "0 2px 0 0", opacity: 0.6 }} />
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 20 }}>{t.emoji}</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.desc}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{ff(t.monthly)}/mo</div>
                              {saved > 0 ? (
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>-{saved}y</div>
                                  <div style={{ fontSize: 9, color: "var(--green)", fontFamily: "'DM Mono', monospace", opacity: 0.8 }}>retire @ {t.retireAge}</div>
                                </div>
                              ) : (
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{"< 1y"}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Combo power-up */}
                    {topCombo.length > 1 && comboSaved > 0 && (
                      <div style={{
                        marginTop: 12,
                        background: "linear-gradient(135deg, rgba(124,202,152,0.1) 0%, rgba(91,141,239,0.08) 100%)",
                        border: "1px solid rgba(124,202,152,0.3)",
                        borderRadius: 12,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}>
                        <div style={{ fontSize: 28 }}>⚡</div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 2 }}>
                            Power Combo: Retire {comboSaved} years earlier at age {comboAge}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            Combine {topCombo.map(t => t.name.toLowerCase()).join(" + ")} to redirect {ff(comboMonthly)}/mo into your portfolio
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--green)", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{comboAge}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>vs {baseAge} currently</div>
                        </div>
                      </div>
                    )}

                    {/* Extra invest slider bar chart */}
                    <div style={{ marginTop: 16, background: "var(--surface-raised)", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
                        Extra monthly investment → Retirement age
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {scenarioData.map((s, i) => {
                          const saved = baseAge - s.retireAge;
                          const maxSaved = baseAge - scenarioData[scenarioData.length - 1].retireAge;
                          const barPct = maxSaved > 0 ? (saved / maxSaved) * 100 : 0;
                          const isCurrent = s.extra === 0;
                          return (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 1fr 60px", gap: 8, alignItems: "center" }}>
                              <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: isCurrent ? "var(--text-secondary)" : "var(--text-muted)", textAlign: "right", fontWeight: isCurrent ? 600 : 400 }}>
                                {isCurrent ? "current" : `+${ff(s.extra)}`}
                              </div>
                              <div style={{ position: "relative", height: 20, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                                {/* Base bar (current) */}
                                {isCurrent && (
                                  <div style={{ position: "absolute", inset: 0, background: "rgba(94,104,130,0.3)", borderRadius: 4 }} />
                                )}
                                {/* Savings bar */}
                                {!isCurrent && saved > 0 && (
                                  <div style={{
                                    position: "absolute", top: 0, left: 0, bottom: 0,
                                    width: `${barPct}%`,
                                    background: `linear-gradient(90deg, var(--green), rgba(124,202,152,${0.4 + (barPct / 100) * 0.6}))`,
                                    borderRadius: 4,
                                    transition: "width 0.3s ease",
                                  }} />
                                )}
                                {/* Label inside bar */}
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                                  <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: !isCurrent && saved > 0 ? "#fff" : "var(--text-muted)" }}>
                                    Age {s.retireAge}{saved > 0 && !isCurrent ? ` (−${saved}y)` : ""}
                                  </span>
                                </div>
                              </div>
                              <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: !isCurrent && saved > 0 ? "var(--green)" : "var(--text-muted)" }}>
                                {saved > 0 && !isCurrent ? `−${saved}y` : "—"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        </>}
      </div>
    </div>
  );

  // ─── Scenario helpers ──────────────────────────────────────────
  function computeRetireAge(monthlyContrib) {
    const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
    const mr = weightedReturn / 100 / 12;
    let bal = totalPortfolioBalance;
    for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
      const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
      const annual = futureSpend * 12 / (1 - taxRate / 100);
      if (bal >= annual / 0.04 && y > 0) return currentAge + y;
      for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + monthlyContrib;
    }
    return lifeExpectancy;
  }

  function computeRetireAgeOneTime(lumpSum) {
    const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
    const mr = weightedReturn / 100 / 12;
    let bal = totalPortfolioBalance + lumpSum;
    for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
      const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
      const annual = futureSpend * 12 / (1 - taxRate / 100);
      if (bal >= annual / 0.04 && y > 0) return currentAge + y;
      for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + totalInvestmentContribution;
    }
    return lifeExpectancy;
  }

  function computeRetireAgeReturn(annualRet) {
    const { currentAge, retireSpend, lifeExpectancy, inflationRate, taxRate } = profile;
    const mr = annualRet / 100 / 12;
    let bal = totalPortfolioBalance;
    for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
      const futureSpend = retireSpend * Math.pow(1 + inflationRate / 100, y);
      const annual = futureSpend * 12 / (1 - taxRate / 100);
      if (bal >= annual / 0.04 && y > 0) return currentAge + y;
      for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + totalInvestmentContribution;
    }
    return lifeExpectancy;
  }

  function computeRetireAgeSpend(spend) {
    const { currentAge, lifeExpectancy, inflationRate, taxRate } = profile;
    const mr = weightedReturn / 100 / 12;
    let bal = totalPortfolioBalance;
    for (let y = 0; y <= lifeExpectancy - currentAge; y++) {
      const futureSpend = spend * Math.pow(1 + inflationRate / 100, y);
      const annual = futureSpend * 12 / (1 - taxRate / 100);
      if (bal >= annual / 0.04 && y > 0) return currentAge + y;
      for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + totalInvestmentContribution;
    }
    return lifeExpectancy;
  }
}
