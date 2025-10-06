# Signalist

A Next.js (App Router) application for personal stock tracking with:

- Watchlists (MongoDB/Mongoose)
- Price alerts (email) scheduled via Inngest
- Market news summaries and welcome/inactive-user emails (AI + Inngest)
- Search with watchlist awareness (filled stars for items in your watchlist)
- Tailwind CSS v4 UI components and TradingView widgets

## Tech stack

- Next.js 15 App Router (TypeScript)
- Tailwind CSS v4
- MongoDB via Mongoose
- Better Auth (email + password) with MongoDB adapter
- Inngest (background jobs + cron, Gemini AI integration)
- Nodemailer (Gmail SMTP)
- Finnhub API (quotes, search, company news)

## Features

- Watchlist
  - Add/remove stocks from multiple entry points (header search, dashboard, watchlist table)
  - Watchlist table shows price, daily change, market cap, P/E, with scrollable layout
- Alerts (email)
  - Create alerts from Watchlist page (header "Create Alert" or per-row "Add Alert")
  - Conditions: Price > or Price < threshold
  - Frequency: Once per day / week / month
  - Email templates: upper and lower thresholds with brand styling
  - Alerts sidebar lists all alerts with company logo, live price, and change % (when Finnhub key is configured)
  - Edit and Delete inline on each alert card
- Search
  - Global Search (header) and page-level Search use the same component
  - Filled star indicates the stock is already in your watchlist
  - Toggle add/remove without leaving the dialog
- Email automations (Inngest)
  - Welcome email (on app/user.created)
  - Daily market news digest (cron: 0 12 \* \* \*)
  - Inactive-user reminder (cron: 0 10 _/7 _ \*)

## Requirements

- Node.js 18+
- npm 10+
- MongoDB instance (e.g. MongoDB Atlas)

## Setup

1. Install dependencies

```bash
npm ci
```

2. Environment variables (.env.local)

```
# MongoDB
MONGODB_URI=mongodb+srv://...

# Better Auth
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000

# Finnhub
FINNHUB_API_KEY=your-finnhub-key
# Optionally expose in the browser (quotes/news also read from this if present)
NEXT_PUBLIC_FINNHUB_API_KEY=your-finnhub-key

# Inngest AI (Gemini)
GEMINI_API_KEY=your-gemini-key

# Email (Gmail SMTP)
NODEMAILER_EMAIL=you@gmail.com
NODEMAILER_PASSWORD=your-app-password
```

3. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

## Common commands

- Lint

```bash
npm run lint .
```

- Build and start

```bash
npm run build
npm run start
```

- Type-check locally (build ignores TS errors by config)

```bash
npx tsc --noEmit
```

- Enviroment Variables

```bash
NODE_ENV=development-and-production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MONGODB_URI=your-mongodb-uri
BETTER_AUTH_SECRET=your-betterauth-secret
BETTER_AUTH_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key
NODEMAILER_EMAIL=your-nodemailer-email
NODEMAILER_PASSWORD=your-nodemailer-password
NEXT_PUBLIC_FINNHUB_API_KEY=your-finnhub-api-key
```

## How alerts work

- Create an alert in Watchlist (dialog). Choose Price > or Price < and a frequency.
- Background jobs run via Inngest crons:
  - Daily: 0 13 \* \* \* (UTC)
  - Weekly: 0 13 \* \* 1
  - Monthly: 0 13 1 \* \*
- Each job fetches the latest quote from Finnhub and emails if the condition is met.

Notes:

- If a Finnhub plan doesn’t allow company news for a symbol/exchange, the app will gracefully skip those entries and continue with general news.
- The Alerts sidebar displays logos, price, and change% when Finnhub keys are configured. Without keys, these fields may be blank but the UI still renders.

## Project structure (high level)

- app/(auth) – Auth pages
- app/(root) – Dashboard, Watchlist, Stocks pages
- app/api/inngest/route.ts – Inngest entrypoint
- components/ – UI, SearchCommand, tables, dialogs
- database/ – Mongoose connection and models
- lib/actions – Server actions (auth, finnhub, watchlist, alerts, user)
- lib/inngest – Inngest client + functions (news, welcome, inactive-users, price alerts)
- lib/nodemailer – Transport and email templates

## Troubleshooting

- Stars in SearchCommand not filling: ensure initialStocks include isInWatchlist (the header and Watchlist page already pass watchlist-aware lists). Filled state requires fill="currentColor" on the star SVG (already implemented).
- Finnhub 403 on company news (e.g. some exchanges): indicates plan/endpoint restrictions. Logs are warnings and the app continues with fallbacks.
- Cron jobs: run in environments where scheduled execution is enabled. Locally you can trigger flows by signing up (welcome email) or relying on scheduled jobs once deployed.
