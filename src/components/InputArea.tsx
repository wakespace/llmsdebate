"use client";

import { useDeliberationStore } from "@/store/useDeliberationStore";
import { BrainCircuit, Settings2, Play, RefreshCw, AlertCircle, HelpCircle, Save, Check } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

import { ALL_MODELS, getModelProvider } from "@/lib/models";
import registryData from "@/data/models_registry.json";

export function InputArea() {
  const { 
    prompt, setPrompt, selectedModels, toggleModel, 
    summarizationEnabled, setSummarizationEnabled, 
    status, startDeliberation, startNextRound, reset,
    systemPrompt, setSystemPrompt, responses,
    selectedResponseIds, roundPrompt, setRoundPrompt,
    activeModelsIds, setSettingsOpen
  } = useDeliberationStore();

  const [localModels, setLocalModels] = useState<{id: string, name: string}[]>([]);
  const [providerStatus, setProviderStatus] = useState<Record<string, { available: boolean; reason?: string }>>({});
  const [openRouterFreeModels, setOpenRouterFreeModels] = useState<string[] | null>(null);
  const [savedSystemPrompt, setSavedSystemPrompt] = useState(false);
  
  // Local draft of system prompt. Only persists when user clicks Save.
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(systemPrompt);

  // Sync draft when the persistent systemPrompt changes (e.g. on reset or reload)
  useEffect(() => {
    setDraftSystemPrompt(systemPrompt);
  }, [systemPrompt]);

  const isDeliberating = status === 'deliberating' || status === 'loading';
  const isInitialRound = responses.length === 0;

  useEffect(() => {
    fetch('/api/local')
      .then(res => res.json())
      .then(data => {
        if (data.models && Array.isArray(data.models)) {
          const chatModels = data.models.filter((m: any) => 
            !m.id.toLowerCase().includes('embedding') && 
            !m.id.toLowerCase().includes('text-embed')
          );
          const mapped = chatModels.map((m: any) => ({
            id: `local/${m.id}`,
            name: `${m.id} (Local)`
          }));
          setLocalModels(mapped);
        }
      })
      .catch(() => console.error("Could not fetch local models"));
  }, []);

  // Fetch provider availability status
  useEffect(() => {
    fetch('/api/models/status')
      .then(res => res.json())
      .then(data => setProviderStatus(data))
      .catch(() => {});
  }, []);

  // Fetch OpenRouter dynamic pricing for free models
  useEffect(() => {
    fetch('/api/models/pricing')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.freeModels)) {
          setOpenRouterFreeModels(data.freeModels);
        }
      })
      .catch(() => console.error("Could not fetch OpenRouter pricing"));
  }, []);

  const isModelDisabled = (modelId: string): boolean => {
    const provider = getModelProvider(modelId);
    const st = providerStatus[provider];
    return st ? !st.available : false;
  };

  const getDisabledReason = (modelId: string): string | undefined => {
    const provider = getModelProvider(modelId);
    return providerStatus[provider]?.reason;
  };

  const allModels = useMemo(() => {
    // Flatten registryData into a single array
    const registryArray = [
      ...registryData.openai,
      ...registryData.gemini,
      ...registryData.perplexity,
      ...registryData.openrouter,
      ...registryData.local
    ];

    // Filter only those the user kept active via the Settings Sidebar
    const activeModels = registryArray.filter(m => activeModelsIds.includes(m.id));

    const updatedModels = activeModels.map(m => {
      // If it's an OpenRouter model we initially deemed 'free', but it's absent from real-time free list:
      if (m.provider === 'openrouter' && m.free === true && openRouterFreeModels !== null) {
        const rawId = m.id.replace('openrouter/', '');
        if (!openRouterFreeModels.includes(rawId)) {
          return {
            ...m,
            free: false,
            costTier: 'caro' as const, // Override to paid
            description: "⚠️ [A OpenRouter encerrou o período gratuito] " + m.description
          };
        }
      }
      return m;
    });

    return [
      ...updatedModels, 
      // Ensure discovered local models are also shown if they were activated
      ...localModels
          .filter(lm => activeModelsIds.includes(lm.id) && !updatedModels.some(um => um.id === lm.id))
          .map(m => ({ ...m, provider: 'local', free: true, description: '', strengths: [] as string[], costTier: 'grátis' as const, bestFor: '' }))
    ];
  }, [activeModelsIds, localModels, openRouterFreeModels]);

  useEffect(() => {
    // Clean up any stale model IDs that were saved in the user's localStorage
    // but no longer exist in the application's predefined model lists.
    const invalidSelectors = selectedModels.filter(id => !allModels.some(m => m.id === id));
    if (invalidSelectors.length > 0) {
      invalidSelectors.forEach(invalidId => toggleModel(invalidId));
    }
  }, [selectedModels, allModels, toggleModel]);

  const canStart = prompt.trim().length > 0 && selectedModels.length > 0;

  return (
    <header className="glass-panel rounded-2xl p-6 flex flex-col gap-4 shrink-0 animate-fade-in shadow-xl relative z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <BrainCircuit className="w-6 h-6 text-zinc-100" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white drop-shadow-sm">
              Sistema de Deliberação
            </h1>
            <p className="text-sm text-zinc-400 font-medium">
              Raciocínio assistido por múltiplos LLMs
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Sumarização Automática</span>
            <div className="relative inline-block w-11 h-6 transition duration-300 ease-in-out align-middle">
              <input 
                type="checkbox" 
                className="peer absolute w-0 h-0 opacity-0"
                checked={summarizationEnabled}
                onChange={(e) => setSummarizationEnabled(e.target.checked)}
                disabled={isDeliberating}
              />
              <span className="absolute inset-0 bg-white/10 peer-checked:bg-white rounded-full transition-all duration-300 border border-white/10 peer-checked:border-white shadow-inner"></span>
              <span className="absolute left-1 top-1 w-4 h-4 bg-zinc-400 peer-checked:bg-zinc-900 rounded-full transition-transform duration-300 transform peer-checked:translate-x-5 shadow-sm"></span>
            </div>
          </label>
          <button 
            onClick={() => {
              reset();
              setDraftSystemPrompt(systemPrompt);
            }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-lg transition-all text-sm font-medium border border-white/10 hover:border-white/20 hover:shadow-lg active:scale-95 backdrop-blur-md"
          >
            <RefreshCw className="w-4 h-4" />
            Nova Deliberação
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-start mt-2">
        {/* Left: System Prompt + User Prompt + Button */}
        <div className="flex-1 flex flex-col gap-3">
          {/* System Prompt */}
          <div className="relative">
            <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-1.5 block">
              System Prompt
            </label>
            <textarea 
              value={draftSystemPrompt}
              onChange={(e) => setDraftSystemPrompt(e.target.value)}
              disabled={isDeliberating}
              className="w-full h-20 bg-black/10 border border-white/5 rounded-xl p-3 text-zinc-500 placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 focus:text-zinc-300 transition-all resize-none shadow-inner disabled:opacity-50 text-sm leading-relaxed backdrop-blur-sm"
              placeholder="Instruções de sistema para os modelos..."
            />
          </div>

          {/* User Prompt */}
          <div className="relative group flex flex-col">
            <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-1.5 block">
              User Prompt
            </label>
            <textarea 
              value={isInitialRound ? prompt : roundPrompt}
              onChange={(e) => isInitialRound ? setPrompt(e.target.value) : setRoundPrompt(e.target.value)}
              disabled={isDeliberating}
              className="w-full h-28 bg-black/20 border border-white/10 rounded-xl p-4 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all resize-none shadow-inner disabled:opacity-50 text-base leading-relaxed backdrop-blur-sm"
              placeholder={isInitialRound ? "Descreva o problema complexo que requer deliberação..." : "Adicione uma diretriz, contra-argumento ou contribuição para a próxima rodada (Opcional)..."}
            />
            {isInitialRound && prompt.length > 0 && prompt.length < 10 && (
               <div className="absolute bottom-3 right-4 text-orange-400 text-xs flex items-center gap-1 opacity-80">
                 <AlertCircle className="w-3 h-3" /> Muito curto
               </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (isInitialRound) {
                  startDeliberation(draftSystemPrompt);
                } else {
                  startNextRound(draftSystemPrompt);
                }
              }}
              disabled={isDeliberating || !canStart}
              className="px-6 py-3 shrink-0 flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl transition-all font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] border border-white/10 group disabled:shadow-none"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              {isDeliberating ? 'Em andamento...' : (isInitialRound ? 'Iniciar Deliberação' : `Próxima Rodada (${responses.length > 0 ? useDeliberationStore.getState().round + 1 : 1})`)}
            </button>

            <button
              onClick={() => {
                setSystemPrompt(draftSystemPrompt);
                setSavedSystemPrompt(true);
                setTimeout(() => setSavedSystemPrompt(false), 2000);
              }}
              disabled={isDeliberating || draftSystemPrompt === systemPrompt}
              className="px-4 py-3 flex items-center gap-2 bg-black/20 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-white/10 text-sm font-medium disabled:opacity-30 disabled:hover:bg-black/20 disabled:hover:text-zinc-400"
            >
              {savedSystemPrompt ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar System Prompt
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Right: Model Selection */}
        <div className="w-72 flex flex-col gap-3 bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1">
            Especialistas
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="text-zinc-600 hover:text-white transition-colors" 
                title="Configurações da Lista de Modelos e APIs"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              <Link href="/models" target="_blank" className="text-zinc-600 hover:text-white transition-colors" title="Ver detalhes dos modelos">
                <HelpCircle className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {allModels.map((model) => {
              const disabled = isModelDisabled(model.id);
              const reason = getDisabledReason(model.id);
              const isPaid = !('free' in model) || !model.free;
              return (
                <label 
                  key={model.id} 
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors border border-transparent ${
                    disabled 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'hover:bg-white/5 cursor-pointer hover:border-white/5'
                  }`}
                  title={disabled ? `⚠ ${reason}` : model.name}
                >
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-white/20 text-white focus:ring-white/30 focus:ring-offset-zinc-950 bg-black/40 cursor-pointer accent-white mix-blend-screen shrink-0" 
                    checked={!disabled && selectedModels.includes(model.id)}
                    onChange={() => !disabled && toggleModel(model.id)}
                    disabled={isDeliberating || disabled}
                  />
                  <span className={`text-sm font-medium truncate ${disabled ? 'text-zinc-600' : 'text-zinc-300'}`}>{model.name}</span>
                  {isPaid && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 shrink-0 ml-auto" title="Requer créditos">$</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
