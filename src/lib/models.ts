export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  description: string;
  strengths: string[];
  costTier: 'grátis' | 'barato' | 'moderado' | 'caro';
  bestFor: string;
}

// All models ordered by approximate benchmark ranking (highest first)
// Ranking based on LMSYS Arena, MMLU-Pro, HumanEval, reasoning benchmarks
export const ALL_MODELS: ModelInfo[] = [
  {
    id: "openai/gpt-5.2-high",
    name: "GPT-5.2 High",
    provider: "openai",
    free: false,
    description: "Extremamente competente com matemática/lógica universal e top de linha na análise de dados. Ponto fraco: Desempenho no seguimento estrito de instruções é mais baixo.",
    strengths: ["Matemática", "Lógica universal", "Análise de dados"],
    costTier: "caro",
    bestFor: "Design de algoritmos complexos, cálculos de back-end robustos e tomada de decisão estratégica do sistema.",
  },
  {
    id: "openai/gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    provider: "openai",
    free: false,
    description: "Liderança absoluta no universo de código e otimização para engenharia de software real. Ponto fraco: Vocabulário puramente técnico e configurações de esforço máximo atrasam as respostas.",
    strengths: ["Universo de código", "Engenharia de software", "Refatoração massiva"],
    costTier: "caro",
    bestFor: "Essencial para construir soluções do zero, montar projetos TypeScript robustos com múltiplos arquivos e produtos reais para produção.",
  },
  {
    id: "openai/gpt-5.1-codex-max-high",
    name: "GPT-5.1 Codex Max High",
    provider: "openai",
    free: false,
    description: "Altamente consistentes com contexto longo em ambientes agênticos e código avançado. Ponto fraco: Já substituídos em capacidade plena pela geração 5.2.",
    strengths: ["Contexto longo", "Ambientes agênticos", "Código avançado"],
    costTier: "caro",
    bestFor: "Excelentes se o seu orçamento para a API estiver levemente apertado, permitindo geração de código React/Node.",
  },
  {
    id: "gemini-3-pro-preview-high",
    name: "Gemini 3 Pro Preview",
    provider: "gemini",
    free: false,
    description: "Rei inquestionável do contexto longo (1 milhão de tokens) e fluência multimodal invejável. Ponto fraco: Em raciocínio estrito matemático, perdeu espaço para Opus e GPT.",
    strengths: ["Contexto colossal", "Fluência multimodal", "Compreende vídeos e UIs"],
    costTier: "caro",
    bestFor: "Vibe coding: Entregar guias PDF, UIs completas e o repositório de uma vez para mapear a arquitetura inteira do software.",
  },
  {
    id: "gemini-3-flash-preview-high",
    name: "Gemini 3 Flash Preview",
    provider: "gemini",
    free: true,
    description: "Custo excepcional com raciocínio brilhante para seguimento de instruções em janela de 1M tokens. Ponto fraco: Menor acurácia em codificação complexa sem instruções explícitas.",
    strengths: ["Custo excepcional", "Seguimento de instruções", "Processamento rápido"],
    costTier: "grátis",
    bestFor: "Geração em larga escala de componentes UI simples, criação de mocks de dados em banco e resumos extensivos.",
  },
  {
    id: "openai/gpt-5.1-high",
    name: "GPT-5.1 High",
    provider: "openai",
    free: false,
    description: "Raciocínio de uso geral balanceado e capacidade geral alta. Ponto fraco: Faltam os ajustes específicos focados puramente em engenharia ágil.",
    strengths: ["Raciocínio genérico forte", "Capacidade geral balanceada"],
    costTier: "caro",
    bestFor: "Escrever ótima documentação para as suas APIs ou analisar bases lógicas que não exijam geração severa de código.",
  },
  {
    id: "openai/gpt-5-pro",
    name: "GPT-5 Pro",
    provider: "openai",
    free: false,
    description: "Raciocínio de uso geral balanceado e capacidade geral competitiva para sua classe. Ponto fraco: Ausência de especialização voltada 100% à engenharia de software.",
    strengths: ["Raciocínio balanceado", "Fundamentação geral"],
    costTier: "moderado",
    bestFor: "Documentação de arquitetura avançada e estruturação de conhecimento de projeto sem focar em geração técnica estrita.",
  },
  {
    id: "openai/gpt-5.1-codex",
    name: "GPT-5.1 Codex",
    provider: "openai",
    free: false,
    description: "Modelo da geração 5.1 altamente consistente para desenvolvimento com longo contexto. Ponto fraco: Capacidade plena ofuscada pela nova geração 5.2.",
    strengths: ["Contexto longo de código", "Ambientes agênticos maduros"],
    costTier: "caro",
    bestFor: "Ótima opção se o orçamento da API estiver levemente apertado, entregando código React/Node de ponta de forma muito proficiente.",
  },
  {
    id: "openai/gpt-5-mini-high",
    name: "GPT-5 Mini High",
    provider: "openai",
    free: false,
    description: "Uma maravilha de custo-benefício. Ponto fraco: Desempenho em raciocínio matemático despenca frente aos modelos maiores.",
    strengths: ["Custo-benefício espetacular", "Desempenho decente", "Baixíssima latência"],
    costTier: "barato",
    bestFor: "Perfeito para tarefas rotineiras de baixa complexidade ou como agentes menores no seu fluxo de desenvolvimento web.",
  },
  {
    id: "perplexity/sonar-deep-research",
    name: "Sonar Deep Research",
    provider: "perplexity",
    free: false,
    description: "O melhor para varreduras exaustivas da web, combinando raciocínio robusto de ponta a ponta. Ponto fraco: Estrutura de cobrança complexa e não desenhado para codificação agêntica local.",
    strengths: ["Varreduras exaustivas da web", "Buscas ativas com lógica acoplada"],
    costTier: "caro",
    bestFor: "Levantar exigências reais, mapear stacks requistadas do exterior e consolidar enormes montantes de pesquisa mercadológica.",
  },
  {
    id: "perplexity/sonar-reasoning-pro",
    name: "Sonar Reasoning Pro",
    provider: "perplexity",
    free: false,
    description: "Respostas fundamentadas com navegação ativa extensa e imenso input. Ponto fraco: Custos de saída punitivos para geração de conteúdos grandes de código.",
    strengths: ["Respostas fundamentadas online", "Contexto imenso até 200k+"],
    costTier: "caro",
    bestFor: "Motores de busca interna para testar ideias de código, onde a garantia de precisão com referências reais supera a necessidade de reescrever texto grande.",
  },
  {
    id: "perplexity/sonar-pro",
    name: "Sonar Pro",
    provider: "perplexity",
    free: false,
    description: "Edição voltada a respostas rápidas fundamentadas por links exatos da web e alto contexto de input. Ponto fraco: Mesmos custos altos que oneram longas saídas (outputs).",
    strengths: ["Busca veloz com precisão de links", "Alta ancoragem"],
    costTier: "moderado",
    bestFor: "Testar paradigmas de implementação rápidos consultando direto nas documentações ativas e vigentes na nuvem.",
  },
  {
    id: "openrouter/qwen/qwen3-vl-30b-a3b-thinking",
    name: "Qwen3 VL Thinking",
    provider: "openrouter",
    free: true,
    description: "Um gigante aberto da familia Qwen otimizado para raciocínio analítico e deliberações visuais.",
    strengths: ["Ponderação estruturada", "Raciocínio visual", "Robustez gratuita"],
    costTier: "grátis",
    bestFor: "Debates prolongados onde a lógica passo a passo (thinking) ajuda a chegar em conclusões precisas sem custo.",
  },
  {
    id: "openrouter/liquid/lfm-2.5-1.2b-thinking:free",
    name: "LFM 2.5 Thinking",
    provider: "openrouter",
    free: true,
    description: "Modelo Liquid super veloz focado em cadeia de pensamentos pré-resposta com alta resiliência na OpenRouter.",
    strengths: ["Ultra rápido", "Excelente disponibilidade", "Pensamento estruturado"],
    costTier: "grátis",
    bestFor: "Análises sintéticas e raciocínio paso a passo sem risco de rate limit excessivo.",
  },
  {
    id: "openrouter/upstage/solar-pro-3:free",
    name: "Solar Pro 3",
    provider: "openrouter",
    free: true,
    description: "Modelo otimizado da Upstage de altíssima qualidade contextual e muito estável na OpenRouter.",
    strengths: ["Lógica aprimorada", "Contexto profundo", "Alta estabilidade"],
    costTier: "grátis",
    bestFor: "Geração estável e respostas ágeis de conhecimento geral sem preocupação de restrições rígidas.",
  },
  {
    id: "openrouter/qwen/qwen3-next-80b-a3b-instruct:free",
    name: "Qwen Next 80B Instruct",
    provider: "openrouter",
    free: true,
    description: "Modelo aberto gigantesco com 80 bilhões de parâmetros focado em seguir instruções complexas. Pode sofrer instabilidade por uso elevado (Rate Limit 429).",
    strengths: ["Tamanho massivo", "Zero rate limits (teórico)", "Seguimento estrito"],
    costTier: "grátis",
    bestFor: "Lógica estruturada e processamento grande gratuito.",
  },
  {
    id: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B Instruct",
    provider: "openrouter",
    free: true,
    description: "A melhor implementação de código aberto pela Meta. Altamente capaz, porém vulnerável a gargalos da comunidade global (Rate Limit 429 freqüente).",
    strengths: ["Melhor open-source atual", "Contexto amplo", "Raciocínio forte"],
    costTier: "grátis",
    bestFor: "Geração de ideias, análise de código e programação assíncrona robusta.",
  }
];


// Separate into free (always shown) and paid (need API key)
export const AVAILABLE_MODELS = ALL_MODELS.filter(m => m.free);
export const OPENAI_MODELS = ALL_MODELS.filter(m => m.provider === 'openai');
export const PERPLEXITY_MODELS = ALL_MODELS.filter(m => m.provider === 'perplexity');

// Maps a model ID to its provider key (used by /api/models/status)
export function getModelProvider(modelId: string): string {
  if (modelId.startsWith('openai/')) return 'openai';
  if (modelId.startsWith('perplexity/')) return 'perplexity';
  if (modelId.startsWith('openrouter/')) return 'openrouter';
  if (modelId.startsWith('local/') || modelId.startsWith('lmstudio')) return 'local';
  if (modelId.includes('gemini')) return 'gemini';
  return 'unknown';
}
