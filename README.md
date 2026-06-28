# Price Tracker

A Next.js app that displays live **Bitcoin** and **gold** prices in USD, with 24-hour change and high/low ranges.

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- [CoinGecko API](https://www.coingecko.com/en/api) for market data

Gold spot price is sourced via [Tether Gold (XAUT)](https://www.coingecko.com/en/coins/tether-gold), a token backed 1:1 by physical gold per troy ounce.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Prices refresh automatically every 60 seconds.

## Live Site

Published on GitHub Pages: [https://doxsee.github.io/price-tracker/](https://doxsee.github.io/price-tracker/)

Pushes to `main` deploy automatically via GitHub Actions.

## Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Start development server |
| `npm run build` | Production build       |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint              |

## Project Structure

```
src/
├── app/
│   ├── api/prices/route.ts   # JSON endpoint for client refresh
│   ├── page.tsx              # Server-rendered dashboard
│   └── layout.tsx
├── components/
│   ├── PriceCard.tsx         # Individual asset card
│   └── PriceDashboard.tsx    # Client dashboard with auto-refresh
└── lib/
    └── prices.ts             # CoinGecko fetch logic
```