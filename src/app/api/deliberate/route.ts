export const maxDuration = 60; // Ensures the host doesn't kill the request quickly

import { NextRequest, NextResponse } from 'next/server';
import { ALL_MODELS } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, round, model, previousResponses, systemPrompt: clientSystemPrompt } = body;

    if (!prompt || !model) {
      return NextResponse.json({ error: 'Valores obrigatórios ausentes' }, { status: 400 });
    }

    // Prepare history and system instructions
    let messages = [];

    // System Prompt from client (or default)
    const systemPrompt = clientSystemPrompt || "Você é um especialista participando num Sistema de Deliberação Assistida por LLMs. Responda SEMPRE em Português do Brasil. IMPORTANTE: Estruture a sua resposta usando EXATAMENTE duas marcações Markdown: '## Análise' e '## Conclusão Final'. Seja claro, estruturado e profissional.";
    
    const modelInfo = ALL_MODELS.find(m => m.id === model);
    let personaAddon = "";
    if (modelInfo && modelInfo.strengths && modelInfo.strengths.length > 0) {
      personaAddon = `\n\nAborde este problema focando nas suas principais forças analíticas: ${modelInfo.strengths.join(", ")}.`;
    }
    const finalSystemPrompt = systemPrompt + personaAddon;

    messages.push({ role: 'system', content: finalSystemPrompt });

    if (round === 1) {
      messages.push({ role: 'user', content: prompt });
    } else {
      let myPreviousResponse = null;
      let otherResponsesText = "";

      if (Array.isArray(previousResponses)) {
        myPreviousResponse = previousResponses.find((r: any) => r.modelId === model);
        const otherResponses = previousResponses.filter((r: any) => r.modelId !== model);
        otherResponsesText = otherResponses.map((r: any) => `[${r.modelName} - Rodada ${r.round}]:\n${r.text}`).join('\n\n');
      }

      const contextualPrompt = `Problema original: ${prompt}\n\nNa rodada anterior, esta foi a sua posição:\n${myPreviousResponse ? myPreviousResponse.text : 'Nenhuma'}\n\nEstas foram as perspectivas válidas apresentadas pelos seus colegas nas rodadas anteriores:\n${otherResponsesText || 'Nenhuma'}\n\nReflita honestamente sobre a sua posição face às dos seus colegas. Se percebe convergência, reconheça e complemente com detalhes práticos. Se percebe divergência, avalie se está errado, parcialmente errado ou se ainda faz sentido manter a sua posição. É perfeitamente aceitável mudar de ideia, fundir ideias ou discordar educadamente justificando o porquê. Evite repetir o que já foi dito — foque-se em agregar clareza ou aprofundar a análise.`;
      
      messages.push({ role: 'user', content: contextualPrompt });
    }

    // Dispatch to the correct provider
    let resultText = "";

    // 1. Google Gemini (Native API)
    if (model.includes("gemini")) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");
      
      // Map OpenAI format to Gemini format natively or use generic endpoint 
      // For simplicity using raw REST Call to Gemini API format.
      const geminiMessages = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{text: m.content}]
      }));
      // Gemini 3.1 Pro Preview may use the same formatting as Gemini 1.5 Pro via REST Call
      const payload = {
        systemInstruction: { parts: [{ text: finalSystemPrompt }] },
        contents: [{ role: "user", parts: [{ text: messages.filter(m => m.role !== 'system').map(m => m.content).join('\n') }] }]
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(55000)
      });
      
      if (!res.ok) {
        let errText = await res.text();
        try {
           const errObj = JSON.parse(errText);
           if (errObj.error?.code === 503 || errObj.error?.status === "UNAVAILABLE") {
              throw new Error("O servidor do Gemini está sobrecarregado no momento. Tente novamente em instantes.");
           }
           if (errObj.error?.code === 429 || errText.toLowerCase().includes("quota") || errObj.error?.status === "RESOURCE_EXHAUSTED") {
              throw new Error("O limite de requisições gratuitas da API do Gemini foi atingido (Quota Excedida). Aguarde alguns minutos ou adicione créditos de faturamento.");
           }
           errText = errObj.error?.message || errText;
        } catch(e: any) {
           if (e.message.includes("sobrecarregado") || e.message.includes("limite de requisições")) throw e;
        }
        throw new Error(`Gemini Error: ${errText}`);
      }
      const data = await res.json();
      resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    
    // 2. OpenRouter (Llama, Qwen, Mixtral)
    else if (model.includes("llama") || model.includes("qwen") || model.includes("mixtral") || model.includes("openrouter/")) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("OPENROUTER_API_KEY não configurada");

      // Strip potential visual prefix or use as is
      const modelId = model.startsWith("openrouter/") ? model.replace("openrouter/", "") : model;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // Required for OpenRouter
          "X-Title": "LLM Delibertation System",
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages
        }),
        signal: AbortSignal.timeout(55000)
      });

      if (!res.ok) {
        let errText = await res.text();
        try {
           const errObj = JSON.parse(errText);
           if (errObj.error?.code === 402 || errText.includes('credits') || errText.includes('max_tokens')) {
              throw new Error("Saldo insuficiente ou limite de tokens atingido na OpenRouter para utilizar este modelo Premium.");
           }
           errText = errObj.error?.metadata?.raw || errObj.error?.message || errText;
        } catch(e: any) {
           if (e.message.includes("Saldo insuficiente")) throw e;
        }

        if (typeof errText === 'string' && errText.includes('rate-limited upstream')) {
           throw new Error("Opção Gratuita Esgotada Temporariamente: Este modelo atingiu o limite de requisições globais da hospedagem. Aguarde alguns segundos ou tente um dos outros modelos.");
        }

        throw new Error(`OpenRouter Error: ${errText}`);
      }
      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || "";
    }
    
    // 3. Perplexity (Sonar models with web search)
    else if (model.startsWith("perplexity/")) {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) throw new Error("PERPLEXITY_API_KEY não configurada. Adicione no .env.local");

      const modelId = model.replace("perplexity/", "");

      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
        }),
        signal: AbortSignal.timeout(55000)
      });

      if (!res.ok) {
        let errText = await res.text();
        console.error(`[perplexity] API error ${res.status}:`, errText.substring(0, 300));
        try {
          const errObj = JSON.parse(errText);
          if (res.status === 401) throw new Error("PERPLEXITY_API_KEY inválida.");
          if (res.status === 429) throw new Error("Limite de requisições Perplexity atingido. Aguarde.");
          errText = errObj.error?.message || errObj.detail || errText;
        } catch (e: any) {
          if (e.message.includes("PERPLEXITY") || e.message.includes("Limite")) throw e;
        }
        throw new Error(`Perplexity Error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || "";
    }
    
    // 4. OpenAI models (via OPENAI_API_KEY)
    else if (model.startsWith("openai/")) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY não configurada. Adicione no .env.local");

      const modelId = model.replace("openai/", "");

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
        }),
        signal: AbortSignal.timeout(55000)
      });

      if (!res.ok) {
        let errText = await res.text();
        console.error(`[openai] API error ${res.status}:`, errText.substring(0, 500));
        try {
          const errObj = JSON.parse(errText);
          if (res.status === 401) throw new Error("OPENAI_API_KEY inválida.");
          if (res.status === 429 || errObj.error?.code === 'insufficient_quota') {
            throw new Error("Sem créditos na API OpenAI. Acesse platform.openai.com/settings/billing");
          }
          errText = errObj.error?.message || errText;
        } catch (e: any) {
          if (e.message.includes("OPENAI") || e.message.includes("créditos")) throw e;
        }
        throw new Error(`OpenAI Error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || "";
    }

    // 4. Local Models (Local server compatible with OpenAI API)
    else {
      const baseUrl = process.env.LOCAL_BASE_URL || "http://localhost:1234/v1";
      const modelId = model.replace("local/", "");

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          messages: messages
        }),
        signal: AbortSignal.timeout(55000)
      });

      if (!res.ok) throw new Error(`Local Server Error: ${await res.text()}`);
      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || "";
    }

    return NextResponse.json({ text: resultText });
    
  } catch (error: any) {
    console.error("Deliberation Error:", error);
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
       return NextResponse.json({ error: "O modelo demorou muito a responder (Timeout de 60s excedido)." }, { status: 504 });
    }
    return NextResponse.json({ error: error.message || "Erro desconhecido" }, { status: 500 });
  }
}
