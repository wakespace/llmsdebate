export const maxDuration = 300; // 5 minutos (Vercel Pro/Local)

import { NextRequest, NextResponse } from 'next/server';
import { JUDGE_SYSTEM_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, transcript, judgeModel, customSystemPrompt } = body;

    if (!prompt || !transcript || !judgeModel) {
      return NextResponse.json({ error: 'Valores obrigatórios ausentes' }, { status: 400 });
    }

    const systemPrompt = customSystemPrompt || JUDGE_SYSTEM_PROMPT;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Problema original: ${prompt}\n\n[DEBATE]\n${transcript}` }
    ];

    let resultText = "";
    const model = judgeModel;

    // 1. Google Gemini / Gemma (Native API)
    if (model.includes("gemini") || model.includes("gemma")) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");

      const modelId = model.startsWith("models/") ? model.replace("models/", "") : model.startsWith("gemini/") ? model.replace("gemini/", "") : model;
      const isGemma = model.includes("gemma");

      const userContent = messages.find(m => m.role === 'user')?.content || "";
      
      const payload: any = {
        contents: [{ role: "user", parts: [{ text: isGemma ? `[INSTRUÇÕES DO SISTEMA/JUÍZ]\n${systemPrompt}\n\n[PROMPT]\n${userContent}` : userContent }] }]
      };
      if (!isGemma) {
        payload.systemInstruction = { parts: [{ text: systemPrompt }] };
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(290000)
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
        } catch(e: unknown) {
           if (e instanceof Error && (e.message.includes("sobrecarregado") || e.message.includes("limite de requisições"))) throw e;
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

      // Check for models that do not support the 'system' role (like Gemma 3)
      let openRouterMessages = [...messages];
      if (model.toLowerCase().includes("gemma")) {
        const systemMsg = openRouterMessages.find(m => m.role === 'system');
        if (systemMsg) {
          openRouterMessages = openRouterMessages.filter(m => m.role !== 'system');
          const firstUserIndex = openRouterMessages.findIndex(m => m.role === 'user');
          if (firstUserIndex !== -1) {
            openRouterMessages[firstUserIndex] = {
               ...openRouterMessages[firstUserIndex],
               content: `[INSTRUÇÕES DO SISTEMA/JUIZ]\n${systemMsg.content}\n\n[INÍCIO DO PROMPT]\n${openRouterMessages[firstUserIndex].content}`
            };
          }
        }
      }

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "LLM Delibertation System",
        },
        body: JSON.stringify({
          model: modelId,
          messages: openRouterMessages
        }),
        signal: AbortSignal.timeout(290000)
      });

      if (!res.ok) {
        let errText = await res.text();
        try {
           const errObj = JSON.parse(errText);
           if (errObj.error?.code === 402 || errText.includes('credits') || errText.includes('max_tokens')) {
              throw new Error("Saldo insuficiente ou limite de tokens atingido na OpenRouter para utilizar este modelo Premium.");
           }
           errText = errObj.error?.message || errText;
        } catch(e: unknown) {
           if (e instanceof Error && e.message.includes("Saldo insuficiente")) throw e;
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
        signal: AbortSignal.timeout(290000)
      });

      if (!res.ok) {
        let errText = await res.text();
        try {
          const errObj = JSON.parse(errText);
          if (res.status === 401) throw new Error("PERPLEXITY_API_KEY inválida.");
          if (res.status === 429) throw new Error("Limite de requisições Perplexity atingido. Aguarde.");
          errText = errObj.error?.message || errObj.detail || errText;
        } catch (e: unknown) {
          if (e instanceof Error && (e.message.includes("PERPLEXITY") || e.message.includes("Limite"))) throw e;
        }
        throw new Error(`Perplexity Error: ${errText}`);
      }
      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || "";
    }
    
    // 4. OpenAI models
    else if (model.startsWith("openai/") || model.startsWith("chatgpt/")) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY não configurada. Adicione no .env.local");

      const modelId = model.replace("openai/", "").replace("chatgpt/", "");

      const endpoint = "https://api.openai.com/v1/responses";
      
      let payload: any = {
        model: modelId
      };

      // Responses API format: flatten messages into a single input string
      const inputText = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n');
      payload.input = inputText;

      // Add reasoning effort for models that heavily leverage it
      const needsReasoning = modelId.includes("codex") || modelId.includes("pro") || /^(o1|o3|o4)/.test(modelId);
      if (needsReasoning) {
        payload.reasoning = { effort: "high" };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(290000)
      });

      if (!res.ok) {
        let errText = await res.text();
        try {
          const errObj = JSON.parse(errText);
          if (res.status === 401) throw new Error("OPENAI_API_KEY inválida.");
          if (res.status === 429 || errObj.error?.code === 'insufficient_quota') {
            throw new Error("Sem créditos na API OpenAI. Acesse platform.openai.com/settings/billing");
          }
          errText = errObj.error?.message || errText;
        } catch (e: unknown) {
          if (e instanceof Error && (e.message.includes("OPENAI") || e.message.includes("créditos"))) throw e;
        }
        throw new Error(`OpenAI Error: ${errText}`);
      }
      const data = await res.json();
      const messageBlock = data.output?.find((o: any) => o.type === "message" || o.content);
      resultText = messageBlock?.content?.find((c: any) => c.type === 'output_text')?.text || data.choices?.[0]?.message?.content || "";
    }

    // 5. Local Models
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
        signal: AbortSignal.timeout(290000)
      });

      if (!res.ok) throw new Error(`Local Server Error: ${await res.text()}`);
      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || "";
    }

    return NextResponse.json({ text: resultText });

  } catch (err: unknown) {
    console.error("Judge Route Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
