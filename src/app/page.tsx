import PriceDashboard from "@/components/PriceDashboard";
import { fetchPrices } from "@/lib/prices";

export const revalidate = 60;

export default async function Home() {
  const prices = await fetchPrices();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-950 px-6 py-16">
      <main>
        <PriceDashboard initialPrices={prices} />
      </main>
    </div>
  );
}