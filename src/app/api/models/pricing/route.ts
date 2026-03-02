import { NextResponse } from 'next/server';

// Cache results for 5 minutes (300,000 ms) to avoid spamming OpenRouter API
let cachedFreeModels: { ids: string[]; timestamp: number } | null = null;
const CACHE_TTL = 300_000;

export async function GET() {
  if (cachedFreeModels && Date.now() - cachedFreeModels.timestamp < CACHE_TTL) {
    return NextResponse.json({ freeModels: cachedFreeModels.ids });
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      // 10s timeout
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API responded with ${res.status}`);
    }

    const data = await res.json();
    
    type OpenRouterModel = { id: string; pricing?: { prompt: string | number; completion: string | number } };
    
    // Filter models where prompt and completion pricing are both exactly '0' or 0
    const freeModels = data.data
      .filter((model: OpenRouterModel) => {
        const p = model.pricing;
        if (!p) return false;
        // Pricing can be string "0" or number 0
        const isPromptFree = p.prompt === 0 || p.prompt === "0";
        const isCompletionFree = p.completion === 0 || p.completion === "0";
        return isPromptFree && isCompletionFree;
      })
      .map((model: OpenRouterModel) => model.id);

    cachedFreeModels = {
      ids: freeModels,
      timestamp: Date.now()
    };

    return NextResponse.json({ freeModels });
  } catch (err: unknown) {
    console.error("Failed to fetch OpenRouter pricing:", err);
    // If we fail but have stale cache, return it
    if (cachedFreeModels) {
      return NextResponse.json({ freeModels: cachedFreeModels.ids });
    }
    // Otherwise return empty array (could indicate everything is paid as a fallback, 
    // but the frontend handles null/empty safely by not modifying the static list if it fails completely)
    return NextResponse.json({ error: "Failed to fetch pricing", freeModels: null }, { status: 500 });
  }
}
