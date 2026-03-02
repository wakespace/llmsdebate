import { useDeliberationStore } from "@/store/useDeliberationStore";
import { AlertTriangle, Brain, Check, ShieldAlert, Sparkles, X } from "lucide-react";
import registryData from "@/data/models_registry.json";
import { AVAILABLE_MODELS } from "@/lib/models";

export function PreflightModal() {
  const { 
    isConfirmModalOpen, 
    cancelDeliberation, 
    confirmDeliberation,
    pendingSystemPrompt,
    prompt,
    roundPrompt,
    round,
    responses,
    selectedResponseIds,
    summarizationEnabled,
    selectedModels,
    setSummarizationEnabled,
    pendingAction
  } = useDeliberationStore();

  if (!isConfirmModalOpen) return null;

  // Calculate tokens
  // A rough estimate: 1 token ≈ 4 characters
  const activePrompt = pendingAction === 'start' ? prompt : roundPrompt;
  const targetRound = pendingAction === 'start' ? 1 : round + 1;
  
  // History calculation
  let historyText = "";
  if (targetRound > 1 && !summarizationEnabled) {
    const validResp = responses
      .filter(r => !r.error && selectedResponseIds.includes(r.id))
      .sort((a,b) => b.round - a.round); // Same as page.tsx truncation logic
      
    let totalLen = 0;
    const kept = [];
    for (const r of validResp) {
      if (totalLen + r.text.length < 45000) {
        kept.push(r);
        totalLen += r.text.length;
      } else {
        break;
      }
    }
    historyText = kept.reverse().map(r => `[${r.modelName}${r.personaName ? ` (${r.personaName})` : ''} - Rodada ${r.round}]:\n${r.text}`).join('\n\n');
  } else if (targetRound > 1 && summarizationEnabled) {
    historyText = "Resumo do Sistema: ... (A síntese será gerada antes do envio economizando milhares de tokens)";
  }

  // System Prompt estimate
  const systemPromptTokens = Math.ceil((pendingSystemPrompt || "").length / 4);
  const userPromptTokens = Math.ceil((activePrompt || "").length / 4);
  const historyTokens = Math.ceil((historyText || "").length / 4);

  const estimatedTotalTokens = systemPromptTokens + userPromptTokens + historyTokens;

  // Combine all models to lookup context length
  const allKnownModels = [
    ...registryData.openai,
    ...registryData.gemini,
    ...registryData.perplexity,
    ...registryData.openrouter,
    ...registryData.local,
    ...AVAILABLE_MODELS
  ];

  const modelWarnings = selectedModels.map(modelId => {
    const knownModel = allKnownModels.find(m => m.id === modelId);
    const contextLength = knownModel?.contextLength || 4096; // Fallback
    const name = knownModel?.name || modelId;
    
    // Safety generic margin of 500 tokens for output
    return {
      id: modelId,
      name,
      limit: contextLength,
      willOverflow: estimatedTotalTokens + 500 > contextLength,
      percentage: Math.min(100, Math.round((estimatedTotalTokens / contextLength) * 100))
    };
  });

  const hasOverflow = modelWarnings.some(m => m.willOverflow);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-white">Confirmação de Contexto (Rodada {targetRound})</h2>
              <p className="text-zinc-400 text-sm">Resumo da carga a ser enviada aos modelos selecionados.</p>
            </div>
          </div>
          <button onClick={cancelDeliberation} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          
          {/* Token usage summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Estimativa de Consumo (Prompt + Histórico)
            </h3>
            <div className="text-3xl font-light text-white mb-1">
              ~{estimatedTotalTokens.toLocaleString('pt-BR')} <span className="text-base text-zinc-500">tokens de input</span>
            </div>
            {targetRound > 1 && !summarizationEnabled && (
               <p className="text-xs text-yellow-500/80 mt-2">
                 Nota: O histórico bruto completo está sendo anexado. Considere usar Sumarização para poupar limite de memória.
               </p>
            )}
          </div>

          {/* Model specific limits */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Limites por Especialista Selecionado</h3>
            <div className="flex flex-col gap-3">
              {modelWarnings.map(m => (
                <div key={m.id} className={`p-3 rounded-lg border ${m.willOverflow ? 'bg-red-500/10 border-red-500/30' : 'bg-white/[0.03] border-white/5'} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    {m.willOverflow ? (
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    ) : (
                      <Check className="w-5 h-5 text-emerald-400" />
                    )}
                    <span className="font-medium text-sm text-zinc-200">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${m.willOverflow ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                    <span className={`text-xs ${m.willOverflow ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                      {m.limit.toLocaleString('pt-BR')} max
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Preview */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Visualização do Contexto Final</h3>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
              <span className="text-indigo-400">{'<SystemPrompt>\n'}</span>
              <span className="text-emerald-400/70">{"/* Placeholder: [A persona atrelada é injetada aqui dinamicamente pra cada modelo] */\n\n"}</span>
              {pendingSystemPrompt}
              <span className="text-indigo-400">{'\n</SystemPrompt>\n\n'}</span>
              
              {targetRound > 1 && historyText && (
                <>
                  <span className="text-sky-400">{'<HistoricoDasRodadas>\n'}</span>
                  {historyText}
                  <span className="text-sky-400">{'\n</HistoricoDasRodadas>\n\n'}</span>
                </>
              )}

              <span className="text-amber-400">{'<UserPrompt>\n'}</span>
              {activePrompt || "(Nenhum input do usuário / apenas instrução contínua)"}
              <span className="text-amber-400">{'\n</UserPrompt>'}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
          <button 
            onClick={cancelDeliberation}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 tracking-wide hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {hasOverflow && targetRound > 1 && !summarizationEnabled && (
              <button 
                onClick={() => setSummarizationEnabled(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Ativar Sumarização
              </button>
            )}
            
            <button 
              onClick={confirmDeliberation}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-lg flex items-center gap-2
                ${hasOverflow 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' 
                  : 'bg-white text-black hover:bg-zinc-200'}`}
            >
              {hasOverflow ? <AlertTriangle className="w-4 h-4" /> : null}
              {hasOverflow ? 'Ignorar Aviso e Enviar' : 'Confirmar Envio'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
