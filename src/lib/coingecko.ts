const MIN_REQUEST_INTERVAL_MS = 1_500;
const MAX_RETRIES = 3;

const DEMO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

let lastRequestAt = 0;
let requestChain: Promise<unknown> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAuthHeaders(): HeadersInit {
  if (!DEMO_API_KEY) {
    return {};
  }

  return {
    "x-cg-demo-api-key": DEMO_API_KEY,
  };
}

function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const entry = JSON.parse(raw) as { data: T; expiresAt: number };
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

function readStaleCache<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return (JSON.parse(raw) as { data: T }).data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T, ttlMs: number): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      key,
      JSON.stringify({ data, expiresAt: Date.now() + ttlMs }),
    );
  } catch {
    // Ignore quota errors.
  }
}

async function performFetch(url: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const now = Date.now();
    const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (now - lastRequestAt));
    if (wait > 0) {
      await sleep(wait);
    }

    lastRequestAt = Date.now();

    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "60");
        await sleep(Math.min(Math.max(retryAfter, 5), 120) * 1_000);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      await sleep(1_000 * (attempt + 1));
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("CoinGecko rate limit reached. Please wait a minute and retry.");
}

interface CoinGeckoErrorBody {
  error?: {
    status?: {
      error_code?: number;
      error_message?: string;
    };
  };
}

async function parseCoinGeckoError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as CoinGeckoErrorBody;
    const message = body.error?.status?.error_message;
    if (message) {
      return message;
    }
  } catch {
    // Fall through to status-based message.
  }

  if (response.status === 401) {
    return "CoinGecko authorization failed. Check your Demo API key.";
  }

  return `CoinGecko request failed (${response.status})`;
}

export function coingeckoFetch(url: string): Promise<Response> {
  const task = requestChain.then(() => performFetch(url));
  requestChain = task.catch(() => undefined);
  return task;
}

export async function fetchCachedJson<T>(
  cacheKey: string,
  url: string,
  ttlMs: number,
): Promise<T> {
  const cached = readCache<T>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await coingeckoFetch(url);

    if (!response.ok) {
      throw new Error(await parseCoinGeckoError(response));
    }

    const data = (await response.json()) as T;
    writeCache(cacheKey, data, ttlMs);
    return data;
  } catch (error) {
    const stale = readStaleCache<T>(cacheKey);
    if (stale) {
      return stale;
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to reach CoinGecko. Wait a minute and try again.",
      );
    }

    throw error;
  }
}

export function chartCacheTtl(days: number): number {
  if (days === 1) return 5 * 60_000;
  if (days === 7 || days === 30) return 15 * 60_000;
  if (days === 90 || days === 180) return 30 * 60_000;
  return 60 * 60_000;
}