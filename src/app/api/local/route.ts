import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.LOCAL_BASE_URL || "http://localhost:1234/v1";
  
  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000)
    });
    
    if (!res.ok) {
      return NextResponse.json({ models: [] }); // Silently ignore as requested
    }
    
    const data = await res.json();
    return NextResponse.json({ models: data.data || [] });
  } catch {
    // Silently ignore if local server doesn't respond
    return NextResponse.json({ models: [] });
  }
}

export async function POST(req: Request) {
  const baseUrl = process.env.LOCAL_BASE_URL || "http://localhost:1234/v1";
  
  try {
    const body = await req.json();
    
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = "Erro do servidor local";
      try {
        const errJson = JSON.parse(errText);
        errorMsg = errJson.error || errJson.message || errorMsg;
      } catch {
        errorMsg = errText || errorMsg;
      }
      
      // Provide user-friendly message for context length errors
      if (errorMsg.toLowerCase().includes('context length') || errorMsg.toLowerCase().includes('tokens to keep')) {
        errorMsg = "O contexto do debate excede o limite do modelo local. Tente reduzir o número de rodadas anteriores ou use um modelo com contexto maior.";
      }
      
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Local Proxy Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro de proxy local" }, { status: 500 });
  }
}
