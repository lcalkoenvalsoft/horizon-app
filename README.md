# Horizon — Financial Planning Platform

A comprehensive personal finance platform with budgeting, investment tracking, retirement planning, net worth tracking, goals, and AI-powered insights.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email, Google, Apple)
- **AI**: Anthropic Claude API (Sonnet)
- **Mobile**: Capacitor (iOS + Android wrapper)
- **Hosting**: Vercel
- **Charts**: Recharts + custom SVG

## Project Structure

```
horizon-app/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing / marketing page
│   ├── login/page.tsx      # Auth page
│   ├── dashboard/
│   │   ├── layout.tsx      # Dashboard shell (sidebar, header)
│   │   ├── page.tsx        # Dashboard overview
│   │   ├── budget/page.tsx
│   │   ├── investments/page.tsx
│   │   ├── investments/[ticker]/page.tsx
│   │   ├── networth/page.tsx
│   │   ├── goals/page.tsx
│   │   └── retirement/page.tsx
│   └── api/
│       ├── ai/route.ts           # Proxy Claude API calls
│       ├── ai/asset/route.ts     # Asset detail lookup
│       ├── ai/upload/route.ts    # Document parsing
│       ├── ai/country/route.ts   # Country insights
│       └── export/route.ts       # PDF/report export
├── components/
│   ├── ui/                 # Shared UI primitives
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Modal.tsx
│   │   └── Tabs.tsx
│   ├── charts/             # Chart components
│   │   ├── DonutChart.tsx
│   │   ├── ProjectionChart.tsx
│   │   ├── MiniBar.tsx
│   │   ├── AllocationBar.tsx
│   │   └── NetWorthLine.tsx
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── KPIRow.tsx
│   │   ├── CountrySelector.tsx
│   │   ├── RetirementForecast.tsx
│   │   ├── TaxOptimization.tsx
│   │   └── FileUpload.tsx
│   ├── budget/
│   │   ├── IncomePanel.tsx
│   │   ├── ExpensePanel.tsx
│   │   ├── BudgetVsActual.tsx
│   │   └── SpendingTrends.tsx
│   ├── investments/
│   │   ├── InvestmentTable.tsx
│   │   ├── AllocationAnalysis.tsx
│   │   └── AssetDetail.tsx
│   ├── networth/
│   │   ├── AssetsPanel.tsx
│   │   ├── LiabilitiesPanel.tsx
│   │   ├── DebtPayoff.tsx
│   │   └── CashFlowCalendar.tsx
│   ├── goals/
│   │   └── GoalCard.tsx
│   └── retirement/
│       ├── ProfileInputs.tsx
│       ├── FirePathways.tsx
│       ├── BoostCalculator.tsx
│       └── FreedomAccelerator.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── middleware.ts    # Auth middleware
│   ├── calculations/
│   │   ├── retirement.ts   # Retirement projection engine
│   │   ├── fire.ts         # FIRE variant calculators
│   │   ├── debt.ts         # Debt payoff calculator
│   │   ├── networth.ts     # Net worth computations
│   │   └── allocation.ts   # Portfolio analysis
│   ├── constants/
│   │   ├── countries.ts    # Country fiscal data
│   │   ├── currencies.ts   # Currency definitions
│   │   └── defaults.ts     # Default budget/investment data
│   ├── hooks/
│   │   ├── useFinancialData.ts   # Main data hook
│   │   ├── useCurrency.ts
│   │   ├── useCountry.ts
│   │   └── useExport.ts
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Formatters & helpers
├── supabase/
│   └── migrations/
│       └── 001_initial.sql # Database schema
├── capacitor/              # Mobile wrapper config
│   ├── capacitor.config.ts
│   └── ios/
│   └── android/
├── public/
│   ├── icons/              # PWA & app icons
│   └── manifest.json       # PWA manifest
├── tailwind.config.ts
├── next.config.js
├── package.json
├── tsconfig.json
└── .env.example
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY

# Run Supabase migrations
npx supabase db push

# Start development
npm run dev

# Build for production
npm run build

# Add mobile platforms
npx cap add ios
npx cap add android
npx cap sync
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_claude_api_key
```
