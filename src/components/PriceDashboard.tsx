"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPrices, type PriceData } from "@/lib/prices";
import PriceCard from "./PriceCard";
import RatioChart from "./RatioChart";

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {[0, 1].map((key) => (
        <div
          key={key}
          className="h-64 animate-pulse rounded-2xl bg-zinc-900/80 ring-1 ring-zinc-800"
        />
      ))}
    </div>
  );
}

export default function PriceDashboard() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const data = await fetchPrices();
      setPrices(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh prices");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
    const interval = setInterval(() => refresh(false), 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const bitcoin = prices.find((p) => p.id === "bitcoin");
  const gold = prices.find((p) => p.id === "tether-gold");

  return (
    <div className="w-full max-w-5xl">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Live Market Prices
        </h1>
        <p className="mt-3 text-zinc-400">
          Real-time Bitcoin and gold spot prices in USD
        </p>
      </header>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {bitcoin && <PriceCard data={bitcoin} accent="bitcoin" />}
          {gold && <PriceCard data={gold} accent="gold" />}
        </div>
      )}

      <RatioChart />

      <footer className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-zinc-500">
          {lastRefreshed
            ? `Last refreshed ${formatTimestamp(lastRefreshed.toISOString())}`
            : "Loading prices…"}
          {prices[0] && (
            <span className="hidden sm:inline">
              {" "}
              · Source updated{" "}
              {formatTimestamp(
                prices.reduce(
                  (latest, p) =>
                    new Date(p.lastUpdated) > new Date(latest)
                      ? p.lastUpdated
                      : latest,
                  prices[0].lastUpdated,
                ),
              )}
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={() => refresh(false)}
          disabled={isLoading || isRefreshing}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing…" : "Refresh now"}
        </button>
      </footer>

      {error && (
        <p className="mt-4 text-center text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        Data provided by{" "}
        <a
          href="https://www.coingecko.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 underline-offset-2 hover:underline"
        >
          CoinGecko
        </a>
        . Gold price tracks spot gold via Tether Gold (XAUT).
      </p>
    </div>
  );
}