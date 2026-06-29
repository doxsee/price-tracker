import { fetchCachedJson } from "@/lib/coingecko";

export interface PriceData {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
  image: string;
}

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

export const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,tether-gold&price_change_percentage_24h=true";

function mapCoin(coin: CoinGeckoMarket): PriceData {
  const isGold = coin.id === "tether-gold";

  return {
    id: coin.id,
    name: isGold ? "Gold" : coin.name,
    symbol: isGold ? "XAU" : coin.symbol.toUpperCase(),
    unit: isGold ? "per troy oz" : "USD",
    price: coin.current_price,
    change24h: coin.price_change_percentage_24h,
    high24h: coin.high_24h,
    low24h: coin.low_24h,
    lastUpdated: coin.last_updated,
    image: coin.image,
  };
}

export async function fetchPrices(): Promise<PriceData[]> {
  const data = await fetchCachedJson<CoinGeckoMarket[]>(
    "coingecko:spot-prices",
    COINGECKO_URL,
    60_000,
  );

  return data.map(mapCoin);
}