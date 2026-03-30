# Horizon — Deployment & App Store Launch Guide

## Overview

This guide takes you from the codebase to live on:
1. **Web** — Vercel (horizon.app or your domain)
2. **iOS** — Apple App Store
3. **Android** — Google Play Store

---

## PHASE 1: Web Platform Deployment

### 1.1 Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Name it "horizon-financial"
3. Once created, go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

4. Run the database migration:
   - Go to **SQL Editor** in Supabase dashboard
   - Paste the contents of `supabase/migrations/001_initial.sql`
   - Click "Run"

5. Enable Auth providers:
   - Go to **Authentication → Providers**
   - Enable **Email** (already on by default)
   - Enable **Google**: Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Enable **Apple**: Requires Apple Developer account (see iOS section)

### 1.2 Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Save as `ANTHROPIC_API_KEY`

### 1.3 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From the project root:
cd horizon-app
vercel

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → Add all from .env.example
```

Or connect via GitHub:
1. Push the code to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variables
4. Deploy

Your web app will be live at `https://your-project.vercel.app`

### 1.4 Custom Domain (Optional)

1. Buy a domain (e.g., horizonfinancial.app)
2. In Vercel → Settings → Domains → Add your domain
3. Update DNS records as instructed

---

## PHASE 2: iOS App (Apple App Store)

### 2.1 Prerequisites

- Mac with Xcode 15+ installed
- Apple Developer account ($99/year) — [developer.apple.com](https://developer.apple.com)
- Node.js 18+

### 2.2 Build the iOS App

```bash
cd horizon-app

# Install dependencies
npm install

# Build the Next.js static export
# First, update next.config.js to add: output: 'export'
npm run build

# Initialize Capacitor iOS
npx cap add ios
npx cap sync

# Open in Xcode
npx cap open ios
```

### 2.3 Xcode Configuration

1. **Signing**: Select your Apple Developer team
2. **Bundle Identifier**: `com.horizon.financial`
3. **Display Name**: "Horizon"
4. **Version**: 1.0.0
5. **Deployment Target**: iOS 16.0+

6. **App Icons**: 
   - Use the icon generator at [appicon.co](https://appicon.co)
   - Replace the AppIcon asset in Xcode

7. **Launch Screen**:
   - Set background color to #0C0F14
   - Add the Horizon logo centered

8. **Capabilities**:
   - Sign in with Apple (if using Apple auth)
   - Associated Domains (for universal links)

### 2.4 Test on Device

```bash
# Run on simulator
npx cap run ios

# Run on physical device (connected via USB)
# Select your device in Xcode → Run
```

### 2.5 Submit to App Store

1. In Xcode: **Product → Archive**
2. **Distribute App → App Store Connect**
3. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com):
   - Create new app
   - Fill in metadata (see App Store Metadata section below)
   - Upload screenshots (see Screenshots section)
   - Submit for review

### 2.6 App Store Review Tips

Apple reviews typically take 24-48 hours. Common rejection reasons:
- **Guideline 4.2**: App must provide sufficient functionality beyond a website → Our app has native feel, offline capability, and haptic feedback
- **Guideline 5.1.1**: Data collection must be declared → Add Privacy Nutrition Labels
- **Guideline 3.1.1**: If you add premium features, use Apple In-App Purchase

---

## PHASE 3: Android App (Google Play)

### 3.1 Prerequisites

- Android Studio installed
- Google Play Developer account ($25 one-time) — [play.google.com/console](https://play.google.com/console)
- Java 17+ (comes with Android Studio)

### 3.2 Build the Android App

```bash
cd horizon-app

# Build Next.js
npm run build

# Initialize Capacitor Android
npx cap add android
npx cap sync

# Open in Android Studio
npx cap open android
```

### 3.3 Android Studio Configuration

1. **Package name**: `com.horizon.financial`
2. **App name**: "Horizon"
3. **Min SDK**: 24 (Android 7.0)
4. **Target SDK**: 34 (Android 14)

5. **App Icon**:
   - Right-click `res` → New → Image Asset
   - Use your Horizon logo
   - Generate adaptive icons

6. **Splash Screen**:
   - Edit `styles.xml` to set splash background to #0C0F14

### 3.4 Generate Signed APK/AAB

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Create a new keystore (SAVE THIS — you can never recover it)
3. Build as **Android App Bundle (.aab)** — required by Google Play

### 3.5 Submit to Google Play

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app
3. Fill in all store listing details
4. Upload the .aab file to **Production → Create new release**
5. Fill in content rating questionnaire
6. Submit for review (typically 1-3 days)

---

## APP STORE METADATA

Use this for both stores:

### App Name
Horizon — Financial Planner

### Subtitle (iOS) / Short Description (Android)
Budget, Invest & Retire Smarter with AI

### Description
Horizon is your complete financial planning platform. Whether you're just starting to invest or optimizing a complex portfolio, Horizon gives you the tools and AI-powered insights to take control of your financial future.

SIMPLE MODE
• Enter your invested amount, cash savings, and age
• See exactly when you can retire
• "Faster to Freedom" calculator — see how extra investment accelerates your timeline
• S&P 500 based projections with historical data

ADVANCED MODE
• Detailed monthly budgeting with income & expense tracking
• Budget vs Actual comparison with bank statement upload
• Investment portfolio tracking with real ticker data
• Account locations (ISA, Pension, Brokerage, Crypto)
• Portfolio allocation analysis with AI interpretation
• Net worth tracking with assets & liabilities
• Debt payoff calculator (avalanche vs snowball)
• Financial goals with progress tracking
• Retirement projection with 5 FIRE pathways
• Country-specific tax optimization insights
• Cash flow calendar
• Spending trend analysis
• Export your complete financial plan
• Drag-and-drop everything to customize your view

POWERED BY AI
• Upload bank statements — AI categorizes transactions automatically
• Live asset data for any ticker symbol
• Country-specific economic insights and tax tips
• Smart portfolio interpretation

25+ country profiles with built-in tax, inflation, and pension data.

### Keywords
finance, budget, investing, retirement, FIRE, net worth, portfolio, savings, financial planning, money management

### Category
Finance

### Privacy Policy URL
(You'll need to create one — use a service like termly.io or iubenda.com)

---

## SCREENSHOTS

You'll need screenshots for:
- **iPhone 6.7" (iPhone 15 Pro Max)**: 1290 × 2796 px
- **iPhone 6.5" (iPhone 14 Plus)**: 1284 × 2778 px
- **iPad 12.9"**: 2048 × 2732 px
- **Android Phone**: 1080 × 1920 px minimum
- **Android 7" Tablet**: Optional
- **Android 10" Tablet**: Optional

### Suggested Screenshot Flow (5-8 screenshots):
1. Simple mode — Financial Snapshot with countdown
2. Simple mode — Faster to Freedom calculator result
3. Advanced Dashboard with KPIs and retirement forecast
4. Budget tab with Budget vs Actual
5. Investments tab with account groups and allocation chart
6. Net Worth with assets, liabilities, debt payoff
7. Goals with progress rings
8. Retirement with FIRE pathways

Use a tool like [screenshots.pro](https://screenshots.pro) or Figma to add device frames and marketing text.

---

## ONGOING UPDATES

### Deployment Workflow

```bash
# Make changes
# ...

# Build and test locally
npm run dev

# Deploy web
git push  # Vercel auto-deploys from main branch

# Update mobile apps
npm run build
npx cap sync
npx cap open ios    # Archive → Submit
npx cap open android  # Build → Upload
```

### Version Management

Update version in:
1. `package.json` → `version`
2. Xcode → General → Version & Build
3. Android `build.gradle` → `versionCode` & `versionName`

---

## COST ESTIMATE

| Item | Cost |
|------|------|
| Vercel (Hobby) | Free |
| Vercel (Pro) | $20/mo |
| Supabase (Free tier) | Free (up to 50K MAUs) |
| Supabase (Pro) | $25/mo |
| Anthropic API | ~$5-50/mo depending on usage |
| Apple Developer | $99/year |
| Google Play Developer | $25 one-time |
| Domain | ~$12/year |
| **Total to launch** | **~$136 first year** |
| **Monthly running cost** | **~$25-70/mo** |
