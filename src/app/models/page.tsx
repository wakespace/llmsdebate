import { ALL_MODELS, type ModelInfo } from "@/lib/models";
import { ArrowLeft, Zap, DollarSign, Brain, Globe, Code, Search, Cpu } from "lucide-react";
import Link from "next/link";

// Removed costColors since we will use the same dynamic logic as ProviderAccordion

const providerColors: Record<string, string> = {
  openai: 'from-slate-500/20 to-slate-500/5 border-slate-500/20',
  openrouter: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
  gemini: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
  perplexity: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
};

const providerNames: Record<string, string> = {
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
  gemini: 'Google',
  perplexity: 'Perplexity',
};

function getIcon(model: ModelInfo) {
  if (model.strengths.includes('Código') || model.strengths.includes('Engenharia de software')) return <Code className="w-5 h-5" />;
  if (model.strengths.includes('Busca web')) return <Search className="w-5 h-5" />;
  if (model.strengths.includes('Raciocínio') || model.strengths.includes('Raciocínio profundo')) return <Brain className="w-5 h-5" />;
  if (model.strengths.includes('Multilíngue') || model.strengths.includes('Open-source')) return <Globe className="w-5 h-5" />;
  if (model.strengths.includes('Velocidade')) return <Zap className="w-5 h-5" />;
  return <Cpu className="w-5 h-5" />;
}

export default function ModelsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Especialistas Disponíveis</h1>
            <p className="text-zinc-400 mt-1">Modelos de IA ordenados por capacidade e performance em benchmarks</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 line-through decoration-emerald-500/50">0</span> Grátis
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">$</span> Requer créditos
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <DollarSign className="w-3 h-3" />
            Custo relativo: 0 (grátis) → $ (barato) → $$ (moderado) → $$$ (caro)
          </div>
        </div>

        {/* Model Cards */}
        <div className="grid gap-4">
          {ALL_MODELS.map((model, index) => (
            <div 
              key={model.id}
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-r p-5 transition-all hover:scale-[1.01] ${providerColors[model.provider] || 'from-white/10 to-white/5 border-white/10'}`}
            >
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-zinc-400 font-bold text-sm shrink-0">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-zinc-300 shrink-0">
                  {getIcon(model)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-white">{model.name}</h2>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-widest ${
                         model.free 
                           ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 line-through decoration-emerald-500/50' 
                           : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                       }`}>
                         {model.free ? '0' : (
                           model.costTier === 'barato' ? '$' : 
                           model.costTier === 'moderado' ? '$$' : '$$$'
                         )}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/10">
                      {providerNames[model.provider] || model.provider}
                    </span>
                  </div>
                  
                  <p className="text-sm text-zinc-400 mb-4">{model.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {model.strengths.map((s) => (
                      <span key={s} className="text-[11px] px-2 py-1 rounded-md bg-white/5 text-zinc-300 border border-white/5">
                        {s}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-zinc-500 mt-2">
                    <span className="text-zinc-400 font-medium tracking-wide">RECOMENDADO PARA:</span> {model.bestFor}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-sm text-zinc-600">
          Ranking baseado em LMSYS Arena, MMLU-Pro, HumanEval e benchmarks de raciocínio. Atualizado em Fev/2026.
        </div>
      </div>
    </main>
  );
}
