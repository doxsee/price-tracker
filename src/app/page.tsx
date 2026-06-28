import PriceDashboard from "@/components/PriceDashboard";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-950 px-6 py-16">
      <main>
        <PriceDashboard />
      </main>
    </div>
  );
}