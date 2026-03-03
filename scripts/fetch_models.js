/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '../src/data/models_registry.json');

// Static fallback or standard premium models that are not easily fetched dynamically without individual admin keys
const FIXED_PREMIUM_MODELS = [
  {
    id: "openai/gpt-5.2-high",
    name: "GPT-5.2 High",
    provider: "openai",
    free: false,
    contextLength: 128000,
    description: "Extremamente competente com matemática/lógica universal e top de linha na análise de dados.",
    strengths: ["Matemática", "Lógica universal", "Análise de dados"],
    costTier: "caro"
  },
  {
    id: "openai/gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    provider: "openai",
    free: false,
    contextLength: 128000,
    description: "Liderança absoluta no universo de código e otimização para engenharia de software.",
    strengths: ["Universo de código", "Engenharia de software", "Refatoração massiva"],
    costTier: "caro"
  },
  {
    id: "models/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    free: false,
    contextLength: 1048576,
    description: "Rei inquestionável do contexto longo (1 milhão de tokens) e fluência multimodal invejável.",
    strengths: ["Contexto colossal", "Fluência multimodal", "Compreende vídeos e UIs"],
    costTier: "caro"
  },
  {
    id: "models/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    free: true,
    contextLength: 1048576,
    description: "Custo excepcional com raciocínio brilhante para seguimento de instruções em janela de 1M tokens.",
    strengths: ["Custo excepcional", "Seguimento de instruções", "Processamento rápido"],
    costTier: "grátis"
  },
  {
    id: "perplexity/sonar-deep-research",
    name: "Sonar Deep Research",
    provider: "perplexity",
    free: false,
    contextLength: 128000,
    description: "O melhor para varreduras exaustivas da web, combinando raciocínio robusto de ponta a ponta.",
    strengths: ["Varreduras exaustivas da web", "Buscas ativas com lógica acoplada"],
    costTier: "caro"
  },
  {
    id: "perplexity/sonar-reasoning-pro",
    name: "Sonar Reasoning Pro",
    provider: "perplexity",
    free: false,
    contextLength: 128000,
    description: "Respostas fundamentadas com navegação ativa extensa e imenso input.",
    strengths: ["Respostas fundamentadas online", "Raciocínio Avançado passo a passo"],
    costTier: "caro"
  },
  {
    id: "perplexity/sonar-pro",
    name: "Sonar Pro",
    provider: "perplexity",
    free: false,
    contextLength: 200000,
    description: "Edição voltada a respostas rápidas fundamentadas por links exatos da web.",
    strengths: ["Busca veloz com precisão de links", "Alta ancoragem"],
    costTier: "moderado"
  },
  {
    id: "perplexity/sonar",
    name: "Sonar",
    provider: "perplexity",
    free: false,
    contextLength: 128000,
    description: "Modelo leve focado em velocidade extrema e ótimo custo-benefício para buscas diretas.",
    strengths: ["Busca Ultra Rápida", "Baixo Custo", "Respostas concisas"],
    costTier: "barato"
  }
];

// Helper to translate text to Portuguese using a free Google Translate API endpoint
async function translateToPortuguese(text) {
  if (!text) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text; // fallback to original if failed
    
    const json = await res.json();
    return json[0].map(item => item[0]).join('');
  } catch (error) {
    console.warn('Failed to translate text, using original:', error.message);
    return text;
  }
}

// Heurísticas fáceis para identificar pontos fortes baseado na descrição
function generateTags(description) {
  const d = description.toLowerCase();
  const tags = [];
  
  if (d.includes('cod') || d.includes('código') || d.includes('programação') || d.includes('software')) tags.push('Código');
  if (d.includes('matemática') || d.includes('lógica') || d.includes('math')) tags.push('Matemática');
  if (d.includes('visão') || d.includes('imagem') || d.includes('multimodal') || d.includes('vision') || d.includes('vídeo') || d.includes('video')) tags.push('Multimodal');
  if (d.includes('raciocínio') || d.includes('raciocinio') || d.includes('reasoning') || d.includes('thinking') || d.includes('pensamento')) tags.push('Raciocínio Avançado');
  if (d.includes('agente') || d.includes('agent') || d.includes('ferramenta') || d.includes('tool')) tags.push('Agentes/Chamada de função');
  if (d.includes('rápido') || d.includes('eficiente') || d.includes('veloz') || d.includes('fast') || d.includes('speed') || d.includes('flash') || d.includes('leve')) tags.push('Alta Velocidade');
  if (d.includes('contexto') || d.includes('tokens') || d.includes('context') || d.includes('janela')) tags.push('Contexto Longo');
  if (d.includes('sem censura') || d.includes('uncensored') || d.includes('sem restrições')) tags.push('Sem Censura');
  if (d.includes('pesquisa') || d.includes('busca') || d.includes('web') || d.includes('search')) tags.push('Pesquisa Web');
  if (d.includes('moe') || d.includes('mistura de especialistas')) tags.push('MoE');

  // fallback se não achar nada
  if (tags.length === 0) {
    if (d.includes('instruct') || d.includes('chat')) tags.push('Instruções e Chat');
    else tags.push('Uso Geral');
  }

  // Pegar somente até 3 tags para manter a UI limpa
  return tags.slice(0, 3);
}

// ======================================
// OPENAI FETCH & HEURISTICS
// ======================================

const OPENAI_CONTEXT_WINDOWS = {
  "gpt-4o-mini": 128000,
  "gpt-4o": 128000,
  "gpt-4-turbo": 128000,
  "o3-mini": 200000,
  "o1-mini": 128000,
  "o1": 200000,
  "gpt-4-32k": 32768,
  "gpt-4": 8192,
  "gpt-3.5-turbo-16k": 16384,
  "gpt-3.5-turbo": 16384
};

function getOpenAIContextLength(modelId) {
  for (const [key, ctx] of Object.entries(OPENAI_CONTEXT_WINDOWS)) {
    if (modelId.includes(key)) return ctx;
  }
  return 8192; // Default safe fallback
}

function getOpenAIStrengths(modelId) {
  const tags = [];
  const idLower = modelId.toLowerCase();
  if (idLower.includes('o1') || idLower.includes('o3') || idLower.includes('reasoning')) {
    tags.push('Raciocínio Avançado', 'Matemática');
  } else if (idLower.includes('gpt-4o')) {
    tags.push('Multimodal', 'Alta Velocidade');
  } else if (idLower.includes('turbo') || idLower.includes('mini')) {
    tags.push('Alta Velocidade');
  }
  
  if (tags.length === 0) tags.push('Uso Geral');
  return tags.slice(0, 3);
}

function getOpenAICostTier(modelId) {
  const idLower = modelId.toLowerCase();
  if (idLower.includes('mini') || idLower.includes('gpt-3.5')) return 'grátis/barato';
  return 'caro';
}

async function fetchOpenAIModels() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ OPENAI_API_KEY não encontrada. Usando modelos de fallback para OpenAI.");
    return FIXED_PREMIUM_MODELS.filter(m => m.provider === 'openai');
  }

  console.log('🔄 Fetching OpenAI models...');
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    
    // Filter conversational models (exclude whisper, tts, dall-e, text-embedding, babbage, etc)
    const excludePatterns = ['whisper', 'tts', 'dall-e', 'embedding', 'babbage', 'davinci', 'curie', 'ada', 'text-search', 'text-similarity', 'code-search', 'moderation', 'audio', 'image', 'realtime', 'transcribe'];
    
    const chatModelsRaw = data.data.filter(m => {
      const id = m.id.toLowerCase();
      if (excludePatterns.some(p => id.includes(p))) return false;
      return id.includes('gpt') || id.startsWith('o1') || id.startsWith('o3');
    });

    const openAIModels = [];
    for (const m of chatModelsRaw) {
       openAIModels.push({
         id: `openai/${m.id}`,
         name: m.id,
         provider: "openai",
         free: false,
         contextLength: getOpenAIContextLength(m.id),
         description: `Modelo oficial da OpenAI (${m.id}). Atualizado com limites de contexto estipulados off-API.`,
         strengths: getOpenAIStrengths(m.id),
         costTier: getOpenAICostTier(m.id),
         _timestamp: m.created || 0
       });
    }

    // Sort by newest first
    openAIModels.sort((a, b) => b._timestamp - a._timestamp);
    openAIModels.forEach(m => delete m._timestamp);

    console.log(`✅ Found ${openAIModels.length} OpenAI chat models.`);
    return openAIModels;
  } catch(e) {
    console.error('❌ Failed to fetch OpenAI models:', e.message);
    return FIXED_PREMIUM_MODELS.filter(m => m.provider === 'openai');
  }
}

async function updateRegistry() {
  console.log('🔄 Fetching OpenRouter dynamic models...');
  let openRouterModels = [];
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    // Filter only free models and exclude specific image/audio/multimodal ones unless they are general chat models
    const excludeTerms = ['vision', 'audio', 'image', 'realtime', 'tts', 'whisper', 'dall-e', 'transcribe'];
    const freeModelsRaw = data.data.filter(m => {
      if (m.pricing?.prompt !== "0" || m.pricing?.completion !== "0") return false;
      const modelId = m.id.toLowerCase();
      // Skip models with unwanted terms (note: some vision models are chat models, but user asked to exclude image/audio)
      if (excludeTerms.some(term => modelId.includes(term))) return false;
      return true;
    });
    
    openRouterModels = [];
    for (const m of freeModelsRaw) {
      const translatedDescription = await translateToPortuguese(m.description || "Modelo gratuito fornecido pela OpenRouter.");
      
      // Calculate intelligence heuristic score
      let rankScore = 0;
      const idLower = m.id.toLowerCase();

      // Tier 5 (State of the art / Heavy open weights)
      if (idLower.includes('llama-3.3') || idLower.includes('70b') || idLower.includes('72b') || idLower.includes('r1') || idLower.includes('deepseek') || idLower.includes('nemotron') || idLower.includes('mixtral-8x22b')) {
        rankScore = 500;
      } 
      // Tier 4 (Very strong mid-weights)
      else if (idLower.includes('llama-3.1') || idLower.includes('qwen-2.5') || idLower.includes('gemma-2') || idLower.includes('command-r')) {
        rankScore = 400;
      } 
      // Tier 3 (Good 8B~14B weights, fine-tunes, vision)
      else if (idLower.includes('llama-3') || idLower.includes('phi-3') || idLower.includes('solar') || idLower.includes('liquid') || idLower.includes('qwen')) {
        rankScore = 300;
      } 
      // Tier 2 (Old gen foundational and roleplay)
      else if (idLower.includes('mistral') || idLower.includes('gemma') || idLower.includes('hermes') || idLower.includes('toppy') || idLower.includes('mythomax') || idLower.includes('zephyr')) {
        rankScore = 200;
      } 
      // Tier 1 (Tiny, old or dumb)
      else {
        rankScore = 100;
      }

      // Tie breaker using context length (longer context usually implies a more modern/capable infra)
      const ctxScore = (m.context_length || 0) / 100000;
      const computedScore = rankScore + ctxScore;

      // Clean (free) string from name
      const cleanName = m.name.replace(/\s*\(free\)/ig, '').replace(/\s*free/ig, '').trim();

      // Discover strengths from text
      const intelligentTags = generateTags(translatedDescription + " " + m.id);
      
      const contextLength = m.context_length || 4096;

      openRouterModels.push({
        id: `openrouter/${m.id}`,
        name: cleanName,
        provider: "openrouter",
        free: true,
        contextLength,
        description: translatedDescription,
        strengths: intelligentTags,
        costTier: "grátis",
        _score: computedScore
      });
    }

    // Sort by intelligence rank (Highest score first = smartest to dumbest)
    openRouterModels.sort((a, b) => b._score - a._score);
    
    // Clean up temporary score property
    openRouterModels.forEach(m => delete m._score);

    console.log(`✅ Found and translated ${openRouterModels.length} free OpenRouter models (Sorted by AI Rank).`);
  } catch(e) {
    console.error('❌ Failed to fetch OpenRouter models:', e.message);
  }

// ======================================
// GEMINI FETCH & HEURISTICS
// ======================================

async function fetchGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY não encontrada. Usando modelos de fallback para Gemini.");
    return FIXED_PREMIUM_MODELS.filter(m => m.provider === 'gemini');
  }

  console.log('🔄 Fetching Gemini models...');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    
    // Filter models that support generateContent and exclude non-chat models
    const geminiExcludeTerms = ['vision', 'audio', 'banana', 'image', 'tts', 'robotics', 'computer-use', 'deep-research'];
    const validModels = data.models.filter(m => {
      if (!m.supportedGenerationMethods || !m.supportedGenerationMethods.includes("generateContent")) return false;
      const nameLC = (m.name || '').toLowerCase();
      const displayLC = (m.displayName || '').toLowerCase();
      if (geminiExcludeTerms.some(term => nameLC.includes(term) || displayLC.includes(term))) return false;
      return true;
    });

    const geminiModels = [];
    for (const m of validModels) {
      const shortId = m.name.replace('models/', '');
      
      geminiModels.push({
        id: m.name,
        name: m.displayName || shortId,
        provider: "gemini",
        free: false,
        contextLength: m.inputTokenLimit || 32768,
        description: m.description,
        strengths: generateTags(m.description || m.displayName || ""),
        costTier: shortId.includes('flash') ? "grátis/barato" : "caro",
      });
    }

    console.log(`✅ Found ${geminiModels.length} Gemini models.`);
    return geminiModels.length > 0 ? geminiModels : FIXED_PREMIUM_MODELS.filter(m => m.provider === 'gemini');
  } catch(e) {
    console.error('❌ Failed to fetch Gemini models:', e.message);
    return FIXED_PREMIUM_MODELS.filter(m => m.provider === 'gemini');
  }
}

  const openAIModels = await fetchOpenAIModels();
  const geminiModels = await fetchGeminiModels();
  
  const finalRegistry = {
    openai: openAIModels,
    gemini: geminiModels,
    perplexity: FIXED_PREMIUM_MODELS.filter(m => m.provider === 'perplexity'),
    openrouter: openRouterModels,
    local: [
      {
        id: "local/llama-3-8b-instruct",
        name: "Llama 3 8B (LM Studio)",
        provider: "local",
        free: true,
        contextLength: 8192,
        description: "Roda 100% offline no seu LM Studio localhost:1234",
        strengths: ["Privacidade total", "Offline"],
        costTier: "grátis"
      }
    ]
  };

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(finalRegistry, null, 2), 'utf-8');
  console.log(`💾 Registry saved to ${REGISTRY_PATH}`);
}

updateRegistry().catch(console.error);
