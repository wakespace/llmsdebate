import { useDeliberationStore } from "@/store/useDeliberationStore";
import { AlertTriangle, Gavel, Check, ShieldAlert, Sparkles, X } from "lucide-react";
import registryData from "@/data/models_registry.json";
import { AVAILABLE_MODELS } from "@/lib/models";
import { JUDGE_SYSTEM_PROMPT } from "@/lib/prompts";

export function SynthesisPreflightModal() {
  const { 
    isSynthesisModalOpen, 
    cancelSynthesisModal, 
    pendingSynthesisModelId,
    requestJudgeSynthesis,
    prompt,
    responses,
    selectedResponseIds,
    isJudging
  } = useDeliberationStore();

  if (!isSynthesisModalOpen || !pendingSynthesisModelId) return null;

  // History calculation (Transcript)
  const validResponses = responses
    .filter(r => !r.error && selectedResponseIds.includes(r.id))
    .sort((a,b) => a.round - b.round || a.modelName.localeCompare(b.modelName));
    
  const transcriptText = validResponses
    .map(r => `## ${r.modelName}${r.personaName ? ` (${r.personaName})` : ''} - Rodada ${r.round}\n\n### Análise\n${r.analysis}\n\n### Conclusão Final\n${r.conclusion}`)
    .join('\n\n---\n\n');

  // String completa para preview exata da montagem final
  const fullPayloadPreview = `Problema original: ${prompt}\n\n[DEBATE]\n${transcriptText}`;

  // Token estimates (rough estimate: 1 token ≈ 4 characters)
  const systemPromptTokens = Math.ceil((JUDGE_SYSTEM_PROMPT).length / 4);
  const userPromptTokens = Math.ceil((fullPayloadPreview).length / 4);

  const estimatedTotalTokens = systemPromptTokens + userPromptTokens;

  // Combine all models to lookup context length
  const allKnownModels = [
    ...registryData.openai,
    ...registryData.gemini,
    ...registryData.perplexity,
    ...registryData.openrouter,
    ...registryData.local,
    ...AVAILABLE_MODELS
  ];

  const knownModel = allKnownModels.find(m => m.id === pendingSynthesisModelId);
  const modelLimit = knownModel?.contextLength || 4096;
  const modelName = knownModel?.name || pendingSynthesisModelId;

  const willOverflow = estimatedTotalTokens + 500 > modelLimit;
  const overflowPercentage = Math.min(100, Math.round((estimatedTotalTokens / modelLimit) * 100));

  const handleConfirm = async () => {
    // Engatilha requisição paralela via Zustand, Modal fechará imediatamente.
    cancelSynthesisModal();
    await requestJudgeSynthesis(pendingSynthesisModelId);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Gavel className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-white">Confirmação de Síntese</h2>
              <p className="text-zinc-400 text-sm">Resumo da carga a ser enviada ao Juiz: <strong className="text-zinc-300">{modelName}</strong></p>
            </div>
          </div>
          <button onClick={cancelSynthesisModal} className="text-zinc-500 hover:text-white transition-colors" disabled={isJudging}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          
          {/* Token usage summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Estimativa de Consumo do Juiz (Prompt + Transcrição)
            </h3>
            <div className="text-3xl font-light text-white mb-1">
              ~{estimatedTotalTokens.toLocaleString('pt-BR')} <span className="text-base text-zinc-500">tokens de input</span>
            </div>
          </div>

          {/* Model specific limit */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Limite do Especialista ({modelName})</h3>
            <div className={`p-3 rounded-lg border flex items-center justify-between ${willOverflow ? 'bg-red-500/10 border-red-500/30' : 'bg-white/[0.03] border-white/5'}`}>
              <div className="flex items-center gap-3">
                {willOverflow ? (
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                ) : (
                  <Check className="w-5 h-5 text-emerald-400" />
                )}
                <span className="font-medium text-sm text-zinc-200">Context Window</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${willOverflow ? 'bg-red-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${overflowPercentage}%` }}
                  />
                </div>
                <span className={`text-xs ${willOverflow ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                  {modelLimit.toLocaleString('pt-BR')} max
                </span>
              </div>
            </div>
          </div>

          {/* Content Preview */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Visualização do Contexto de Submissão</h3>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
              <span className="text-indigo-400">{'<SystemPromptJuiz>\n'}</span>
              {JUDGE_SYSTEM_PROMPT}
              <span className="text-indigo-400">{'\n</SystemPromptJuiz>\n\n'}</span>
              
              <span className="text-amber-400">{'<UserPrompt>\n'}</span>
              {fullPayloadPreview}
              <span className="text-amber-400">{'\n</UserPrompt>'}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
          <button 
            onClick={cancelSynthesisModal}
            disabled={isJudging}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 tracking-wide hover:text-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button 
            onClick={handleConfirm}
            disabled={isJudging}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-lg flex items-center gap-2
              ${willOverflow 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' 
                : 'bg-white text-black hover:bg-zinc-200'} disabled:opacity-50`}
          >
            {willOverflow ? <AlertTriangle className="w-4 h-4" /> : null}
            {isJudging ? 'Processando...' : (willOverflow ? 'Ignorar Aviso e Enviar' : 'Confirmar Avaliação e Síntese')}
          </button>
        </div>

      </div>
    </div>
  );
}
