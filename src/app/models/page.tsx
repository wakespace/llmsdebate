"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Search, Zap, Brain, Globe, Code, Cpu, Gavel, Filter, Sparkles } from "lucide-react";
import Link from "next/link";
import registryData from "@/data/models_registry.json";
import { useDeliberationStore } from "@/store/useDeliberationStore";

interface RegistryModel {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  contextLength: number;
  description?: string;
  strengths: string[];
  costTier: string;
}

const providerMeta: Record<string, { name: string; color: string; gradient: string }> = {
  openai: { name: "OpenAI", color: "text-slate-300", gradient: "from-slate-500/20 to-slate-500/5 border-slate-500/20" },
  openrouter: { name: "OpenRouter", color: "text-blue-300", gradient: "from-blue-500/20 to-blue-500/5 border-blue-500/20" },
  gemini: { name: "Google", color: "text-violet-300", gradient: "from-violet-500/20 to-violet-500/5 border-violet-500/20" },
  perplexity: { name: "Perplexity", color: "text-cyan-300", gradient: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20" },
  local: { name: "Local", color: "text-green-300", gradient: "from-green-500/20 to-green-500/5 border-green-500/20" },
};

// Map task keywords to model strengths for search
const taskToStrengths: Record<string, string[]> = {
  "código": ["Código", "code", "Code"],
  "code": ["Código", "code", "Code"],
  "programação": ["Código", "code", "Code"],
  "programar": ["Código", "code", "Code"],
  "raciocínio": ["Raciocínio Avançado", "Raciocínio", "Matemática"],
  "raciocinar": ["Raciocínio Avançado", "Raciocínio", "Matemática"],
  "reasoning": ["Raciocínio Avançado", "Raciocínio"],
  "matemática": ["Matemática", "Raciocínio Avançado"],
  "math": ["Matemática", "Raciocínio Avançado"],
  "pesquisa": ["Pesquisa Web", "Varreduras exaustivas da web"],
  "search": ["Pesquisa Web", "Varreduras exaustivas da web"],
  "busca": ["Pesquisa Web", "Busca veloz com precisão de links"],
  "rápido": ["Alta Velocidade"],
  "rapido": ["Alta Velocidade"],
  "fast": ["Alta Velocidade"],
  "velocidade": ["Alta Velocidade"],
  "multimodal": ["Multimodal"],
  "imagem": ["Multimodal"],
  "visão": ["Multimodal"],
  "agente": ["Agentes/Chamada de função"],
  "agent": ["Agentes/Chamada de função"],
  "função": ["Agentes/Chamada de função"],
  "function": ["Agentes/Chamada de função"],
  "contexto longo": ["Contexto Longo"],
  "long context": ["Contexto Longo"],
  "barato": ["Alta Velocidade"],
  "grátis": [],
  "free": [],
};

function getIcon(strengths: string[]) {
  if (strengths.some(s => s.toLowerCase().includes("código") || s.toLowerCase().includes("code"))) return <Code className="w-5 h-5" />;
  if (strengths.some(s => s.toLowerCase().includes("pesquisa") || s.toLowerCase().includes("busca"))) return <Search className="w-5 h-5" />;
  if (strengths.some(s => s.toLowerCase().includes("raciocínio") || s.toLowerCase().includes("matemática"))) return <Brain className="w-5 h-5" />;
  if (strengths.some(s => s.toLowerCase().includes("multimodal") || s.toLowerCase().includes("multilíngue"))) return <Globe className="w-5 h-5" />;
  if (strengths.some(s => s.toLowerCase().includes("velocidade"))) return <Zap className="w-5 h-5" />;
  return <Cpu className="w-5 h-5" />;
}

function formatContextLength(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M tokens`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K tokens`;
  return `${tokens} tokens`;
}

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const { activeInstances, setModelInstanceCount, judgeModelsIds, toggleJudgeModel } = useDeliberationStore();

  // Flatten all models from registry
  const allModels: RegistryModel[] = useMemo(() => {
    const models: RegistryModel[] = [];
    for (const [, providerModels] of Object.entries(registryData)) {
      if (Array.isArray(providerModels)) {
        for (const m of providerModels) {
          models.push(m as RegistryModel);
        }
      }
    }
    return models;
  }, []);

  // Get unique providers
  const providers = useMemo(() => {
    const set = new Set(allModels.map(m => m.provider));
    return Array.from(set);
  }, [allModels]);

  // Filter and search
  const filteredModels = useMemo(() => {
    let result = [...allModels];

    // Free filter
    if (freeOnly) {
      result = result.filter(m => m.free);
    }

    // Provider filter
    if (providerFilter !== "all") {
      result = result.filter(m => m.provider === providerFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const words = q.split(/\s+/);
      
      // Score-based ranking: model name match > strengths match > description match
      const scored = result.map(m => {
        let score = 0;
        const nameLC = m.name.toLowerCase();
        const descLC = (m.description || "").toLowerCase();
        const strengthsLC = m.strengths.map(s => s.toLowerCase());

        for (const word of words) {
          // Direct name match
          if (nameLC.includes(word)) score += 10;
          // Description match  
          if (descLC.includes(word)) score += 3;
          // Strength match
          if (strengthsLC.some(s => s.includes(word))) score += 5;
          // Task keyword mapping
          const mappedStrengths = taskToStrengths[word] || [];
          if (mappedStrengths.length === 0 && (word === "grátis" || word === "free")) {
            if (m.free) score += 8;
          }
          for (const mapped of mappedStrengths) {
            if (m.strengths.some(s => s.toLowerCase().includes(mapped.toLowerCase()))) {
              score += 7;
            }
          }
        }
        return { model: m, score };
      });

      // Only include models that matched something, sorted by score
      result = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(s => s.model);
    }

    return result;
  }, [allModels, searchQuery, freeOnly, providerFilter]);

  const totalActive = activeInstances.length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-white/5 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catálogo de Modelos</h1>
            <p className="text-zinc-400 mt-1">
              {allModels.length} modelos disponíveis · {totalActive} instância{totalActive !== 1 ? 's' : ''} ativa{totalActive !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md pb-4 pt-2 -mx-6 px-6 border-b border-white/5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por tarefa: código, raciocínio, pesquisa, rápido, matemática..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
              />
            </div>

            {/* Free only toggle */}
            <button
              onClick={() => setFreeOnly(!freeOnly)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${
                freeOnly
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              Somente Grátis
            </button>

            {/* Provider filter */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
            >
              <option value="all">Todos Provedores</option>
              {providers.map(p => (
                <option key={p} value={p}>{providerMeta[p]?.name || p}</option>
              ))}
            </select>
          </div>
          
          {searchQuery && (
            <p className="text-xs text-zinc-500 mt-2">
              {filteredModels.length} modelo{filteredModels.length !== 1 ? 's' : ''} encontrado{filteredModels.length !== 1 ? 's' : ''}
              {searchQuery && ` para "${searchQuery}"`}
            </p>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 line-through decoration-emerald-500/50">0</span> Grátis
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">$$$</span> Custo Relativo
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Gavel className="w-3 h-3" /> Juiz da Síntese
          </div>
        </div>

        {/* Model Cards Grid */}
        {filteredModels.length === 0 ? (
          <div className="text-center py-20">
            <Cpu className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-zinc-400">Nenhum modelo encontrado</h3>
            <p className="text-sm text-zinc-600 mt-1">Tente ajustar os filtros ou termos de busca.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredModels.map((model) => {
              const instances = activeInstances.filter(inst => inst.modelId === model.id);
              const instanceCount = instances.length;
              const meta = providerMeta[model.provider] || providerMeta.local;

              return (
                <div 
                  key={model.id}
                  className={`relative overflow-hidden rounded-xl border bg-gradient-to-r p-5 transition-all hover:scale-[1.005] ${meta.gradient} ${instanceCount > 0 ? 'ring-1 ring-emerald-500/20' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-zinc-300 shrink-0 mt-0.5">
                      {getIcon(model.strengths)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h2 className="text-base font-semibold text-white">{model.name}</h2>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-widest ${
                          model.free 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 line-through decoration-emerald-500/50' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {model.free ? '0' : (
                            model.costTier === 'barato' || model.costTier === 'grátis/barato' ? '$' : 
                            model.costTier === 'moderado' ? '$$' : '$$$'
                          )}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-medium ${meta.color}`}>
                          {meta.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatContextLength(model.contextLength)}
                        </span>
                      </div>
                      
                      {model.description && (
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{model.description}</p>
                      )}
                      
                      {/* Strengths Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {model.strengths.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/5">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      {/* Instance Count Dropdown */}
                      <select
                        value={instanceCount}
                        onChange={(e) => setModelInstanceCount(model.id, parseInt(e.target.value))}
                        title="Número de instâncias"
                        className={`w-[54px] text-center bg-white/5 border rounded-lg px-1 py-2 text-xs outline-none focus:ring-1 focus:ring-white/20 cursor-pointer transition-all appearance-none font-medium ${
                          instanceCount > 0
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                            : 'border-white/10 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>

                      {/* Judge Toggle */}
                      <button
                        onClick={() => toggleJudgeModel(model.id)}
                        title={judgeModelsIds.includes(model.id) ? "Remover de Juiz" : "Definir como Juiz"}
                        className={`p-2 rounded-lg transition-all border ${
                          judgeModelsIds.includes(model.id)
                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'bg-white/5 text-zinc-500 border-transparent hover:bg-white/10 hover:text-zinc-300'
                        }`}
                      >
                        <Gavel className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center text-sm text-zinc-600">
          {allModels.length} modelos catalogados. Dados atualizados automaticamente via GitHub Actions.
        </div>
      </div>
    </main>
  );
}
