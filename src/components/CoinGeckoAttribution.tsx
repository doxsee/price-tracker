import Image from "next/image";

const ATTRIBUTION_URL =
  "https://www.coingecko.com/en/api?utm_source=price-tracker&utm_medium=referral";

export default function CoinGeckoAttribution() {
  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm text-zinc-400">Data powered by</span>
        <a
          href={ATTRIBUTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex transition-opacity hover:opacity-80"
          aria-label="CoinGecko API"
        >
          <Image
            src="/coingecko-lockup.svg"
            alt="CoinGecko"
            width={140}
            height={31}
            className="h-7 w-auto"
          />
        </a>
      </div>
      <p className="max-w-xl text-center text-xs text-zinc-600">
        Gold price tracks spot gold via Tether Gold (XAUT).
      </p>
    </div>
  );
}