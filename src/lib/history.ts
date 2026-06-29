import { chartCacheTtl, fetchCachedJson } from "@/lib/coingecko";

export interface RatioPoint {
  timestamp: number;
  ratio: number;
  btc: number;
  gold: number;
}

/** CoinGecko Demo plan allows at most 365 days of historical chart data. */
export const DEMO_MAX_HISTORY_DAYS = 365;

export interface Timeframe {
  label: string;
  days: number;
}

export const TIMEFRAMES: Timeframe[] = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: DEMO_MAX_HISTORY_DAYS },
];

type PriceTuple = [number, number];

interface MarketChartResponse {
  prices: PriceTuple[];
}

async function fetchMarketChart(
  coinId: string,
  days: number,
): Promise<PriceTuple[]> {
  const cacheKey = `coingecko:chart:${coinId}:${days}`;
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  const data = await fetchCachedJson<MarketChartResponse>(
    cacheKey,
    url,
    chartCacheTtl(days),
  );

  return data.prices;
}

function nearestGoldPrice(goldPrices: PriceTuple[], timestamp: number): number {
  let left = 0;
  let right = goldPrices.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (goldPrices[mid][0] < timestamp) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  const candidates = [left, left - 1, left + 1].filter(
    (index) => index >= 0 && index < goldPrices.length,
  );

  let bestPrice = goldPrices[0][1];
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const index of candidates) {
    const diff = Math.abs(goldPrices[index][0] - timestamp);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestPrice = goldPrices[index][1];
    }
  }

  return bestPrice;
}

export function computeRatio(
  btcPrices: PriceTuple[],
  goldPrices: PriceTuple[],
): RatioPoint[] {
  if (btcPrices.length === 0 || goldPrices.length === 0) {
    return [];
  }

  const sortedGold = [...goldPrices].sort((a, b) => a[0] - b[0]);

  return btcPrices
    .map(([timestamp, btc]) => {
      const gold = nearestGoldPrice(sortedGold, timestamp);
      if (gold <= 0) {
        return null;
      }

      return {
        timestamp,
        ratio: btc / gold,
        btc,
        gold,
      };
    })
    .filter((point): point is RatioPoint => point !== null);
}

export async function fetchRatioHistory(days: number): Promise<RatioPoint[]> {
  const btcPrices = await fetchMarketChart("bitcoin", days);
  const goldPrices = await fetchMarketChart("tether-gold", days);

  return computeRatio(btcPrices, goldPrices);
}