import Image from "next/image";
import type { PriceData } from "@/lib/prices";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: price >= 1000 ? 0 : 2,
    maximumFractionDigits: price >= 1000 ? 0 : 2,
  }).format(price);
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

interface PriceCardProps {
  data: PriceData;
  accent: "bitcoin" | "gold";
}

const accentStyles = {
  bitcoin: {
    ring: "ring-orange-500/20",
    glow: "from-orange-500/10",
    badge: "bg-orange-500/15 text-orange-300",
    positive: "text-emerald-400",
    negative: "text-rose-400",
    icon: "₿",
  },
  gold: {
    ring: "ring-amber-400/20",
    glow: "from-amber-400/10",
    badge: "bg-amber-400/15 text-amber-200",
    positive: "text-emerald-400",
    negative: "text-rose-400",
    icon: "Au",
  },
};

export default function PriceCard({ data, accent }: PriceCardProps) {
  const styles = accentStyles[accent];
  const isPositive = data.change24h >= 0;
  const changeColor = isPositive ? styles.positive : styles.negative;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl bg-zinc-900/80 p-6 ring-1 ${styles.ring} backdrop-blur-sm`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.glow} to-transparent`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-800">
            <Image
              src={data.image}
              alt={data.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">{data.name}</h2>
            <p className="text-sm text-zinc-400">
              {data.symbol} · {data.unit}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles.badge}`}
        >
          {styles.icon}
        </span>
      </div>

      <div className="relative mt-6">
        <p className="font-mono text-4xl font-semibold tracking-tight text-zinc-50">
          {formatPrice(data.price)}
        </p>
        <p className={`mt-2 text-sm font-medium ${changeColor}`}>
          {formatChange(data.change24h)} <span className="text-zinc-500">24h</span>
        </p>
      </div>

      <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4 text-sm">
        <div>
          <dt className="text-zinc-500">24h High</dt>
          <dd className="mt-1 font-medium text-zinc-200">
            {formatPrice(data.high24h)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">24h Low</dt>
          <dd className="mt-1 font-medium text-zinc-200">
            {formatPrice(data.low24h)}
          </dd>
        </div>
      </dl>
    </article>
  );
}