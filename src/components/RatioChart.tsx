"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchRatioHistory,
  TIMEFRAMES,
  type RatioPoint,
  type Timeframe,
} from "@/lib/history";

function formatRatio(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatAxisDate(timestamp: number, days: number): string {
  const date = new Date(timestamp);

  if (days === 1) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (days === 7 || days === 30) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (days === 90 || days === 180) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

interface RatioChartProps {
  ready?: boolean;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: RatioPoint }>;
  days: number;
}

function RatioTooltip({ active, payload, days }: ChartTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-sm shadow-lg backdrop-blur-sm">
      <p className="font-medium text-zinc-200">
        {new Date(point.timestamp).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: days === 1 ? "short" : undefined,
        })}
      </p>
      <p className="mt-1 font-mono text-violet-300">
        {formatRatio(point.ratio)} oz gold / BTC
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        BTC {formatUsd(point.btc)} · Gold {formatUsd(point.gold)}
      </p>
    </div>
  );
}

export default function RatioChart({ ready = true }: RatioChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[2]);
  const [data, setData] = useState<RatioPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (selected: Timeframe) => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await fetchRatioHistory(selected.days);
      setData(history);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load ratio history",
      );
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    loadHistory(timeframe);
  }, [loadHistory, ready, timeframe]);

  const latestRatio = data.length > 0 ? data[data.length - 1].ratio : null;
  const firstRatio = data.length > 0 ? data[0].ratio : null;
  const ratioChange =
    latestRatio !== null && firstRatio !== null && firstRatio > 0
      ? ((latestRatio - firstRatio) / firstRatio) * 100
      : null;

  const tickInterval = useMemo(() => {
    const length = data.length;
    if (length <= 12) return 1;
    if (length <= 48) return Math.floor(length / 6);
    return Math.floor(length / 8);
  }, [data.length]);

  return (
    <section className="mt-12 rounded-2xl bg-zinc-900/80 p-6 ring-1 ring-violet-500/20 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">
            Bitcoin / Gold Ratio
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Troy ounces of gold one bitcoin buys (BTC ÷ gold spot). Historical
            range limited to 1 year on the CoinGecko Demo plan.
          </p>
          {latestRatio !== null && (
            <p className="mt-3 font-mono text-3xl font-semibold text-violet-300">
              {formatRatio(latestRatio)}
              {ratioChange !== null && (
                <span
                  className={`ml-3 text-sm font-medium ${
                    ratioChange >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {ratioChange >= 0 ? "+" : ""}
                  {ratioChange.toFixed(2)}%
                </span>
              )}
            </p>
          )}
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Historical timeframe"
        >
          {TIMEFRAMES.map((option) => {
            const isActive = option.label === timeframe.label;

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setTimeframe(option)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-6 h-72 w-full sm:h-80">
        {!ready || isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-full w-full animate-pulse rounded-xl bg-zinc-800/60" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="max-w-md text-sm text-rose-400">{error}</p>
            <button
              type="button"
              onClick={() => loadHistory(timeframe)}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            No historical data available for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#3f3f46"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value: number) =>
                  formatAxisDate(value, timeframe.days)
                }
                interval={tickInterval}
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#3f3f46" }}
                minTickGap={24}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(value: number) => formatRatio(value)}
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                content={(props) => (
                  <RatioTooltip {...props} days={timeframe.days} />
                )}
              />
              <Line
                type="monotone"
                dataKey="ratio"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#c4b5fd", stroke: "#7c3aed" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}