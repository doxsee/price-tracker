import { fetchPrices } from "@/lib/prices";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prices = await fetchPrices();
    return NextResponse.json(prices);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch prices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}