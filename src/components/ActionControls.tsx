"use client";

import { useDeliberationStore } from "@/store/useDeliberationStore";
import { Plus, Send, Download, FileText, X, Copy, Check, ChevronUp, ScrollText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ALL_MODELS } from "@/lib/models";

export function ActionControls() {
  const { status, round, responses, selectedModels, startNextRound, endWithFullTranscript, synthesisResult, fullTranscriptResult, clearSynthesis, clearFullTranscript, selectedResponseIds, selectAllResponses, clearResponseSelection, requestJudgeSynthesis, isJudging } = useDeliberationStore();
  const [synthesisModel, setSynthesisModel] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDeliberating = status === 'deliberating' || status === 'loading';
  const hasResponses = responses.length > 0;
  
  // Get active models from the LAST round that didn't error out
  const lastRoundResponses = responses.filter(r => r.round === round && !r.error);
  const activeModels = Array.from(new Set(lastRoundResponses.map(r => r.modelId)));
  const canContinue = hasResponses && status !== 'completed' && !isDeliberating && selectedModels.length > 0 && selectedResponseIds.length > 0;
  
  // Selection logic for synthesis
  const validResponses = responses.filter(r => !r.error);
  const hasSelectedAll = validResponses.length > 0 && selectedResponseIds.length === validResponses.length;
  const synthesisDisabled = status === 'completed' || !canContinue || isJudging || selectedResponseIds.length === 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleSelectAll = () => {
    if (hasSelectedAll) {
      clearResponseSelection();
    } else {
      selectAllResponses();
    }
  };

  // Handle Copy to Clipboard
  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Handle Export
  const handleExport = (includeTranscript?: boolean) => {
    let content = `# Deliberação Assistida por LLMs\n\n`;
    
    // Group by rounds
    const rounds = Array.from(new Set(responses.map(r => r.round))).sort((a,b) => a-b);
    
    for (const r of rounds) {
      content += `## Rodada ${r}\n\n`;
      const roundResponses = responses.filter(res => res.round === r);
      
      for (const res of roundResponses) {
        if (res.error) continue;
        content += `### ${res.modelName}\n\n`;
        content += `#### Análise\n${res.analysis}\n\n`;
        content += `#### Conclusão Final\n${res.conclusion}\n\n`;
        content += `---\n\n`;
      }
    }
    
    if (synthesisResult) {
      content += `## Síntese Final\n\n${synthesisResult}\n\n`;
    }
    
    if (includeTranscript && fullTranscriptResult) {
      content += `## Transcrição Integral\n\n${fullTranscriptResult}\n\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deliberacao-rodadas-${rounds.length}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSynthesize = async () => {
    const targetModel = synthesisModel || activeModels[0] || responses[0]?.modelId;
    if (!targetModel) return;

    setDropdownOpen(false);
    await requestJudgeSynthesis(targetModel);
  };

  const handleFullTranscript = () => {
    setDropdownOpen(false);
    endWithFullTranscript();
  };

  return (
    <>
      {/* Synthesis Modal Overlay */}
      {status === 'completed' && synthesisResult && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden glass-panel">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
               <h2 className="text-xl font-semibold flex items-center gap-2 text-white tracking-tight">
                 <FileText className="w-5 h-5 text-zinc-300" />
                 Síntese da Deliberação
               </h2>
               <div className="flex items-center gap-3">
                 <button onClick={() => handleCopy(synthesisResult)} className="hover:bg-white/10 p-2 rounded-lg text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10" title="Copiar Síntese">
                   {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                 </button>
                 <button onClick={() => clearSynthesis()} className="hover:bg-white/10 p-2 rounded-lg text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10" title="Fechar">
                   <X className="w-5 h-5" />
                 </button>
               </div>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar prose prose-invert max-w-none text-zinc-200">
               <ReactMarkdown>{synthesisResult}</ReactMarkdown>
            </div>
            <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex justify-end">
               <button onClick={() => handleExport()} className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 px-6 py-2.5 rounded-xl transition-all font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                 <Download className="w-4 h-4" /> Exportar em .MD
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Transcript Modal Overlay */}
      {status === 'completed' && fullTranscriptResult && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden glass-panel">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
               <h2 className="text-xl font-semibold flex items-center gap-2 text-white tracking-tight">
                 <ScrollText className="w-5 h-5 text-zinc-300" />
                 Transcrição Integral
               </h2>
               <div className="flex items-center gap-3">
                 <button onClick={() => handleCopy(fullTranscriptResult)} className="hover:bg-white/10 p-2 rounded-lg text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10" title="Copiar Transcrição">
                   {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                 </button>
                 <button onClick={() => clearFullTranscript()} className="hover:bg-white/10 p-2 rounded-lg text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10" title="Fechar">
                   <X className="w-5 h-5" />
                 </button>
               </div>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar prose prose-invert max-w-none text-zinc-200">
               <ReactMarkdown>{fullTranscriptResult}</ReactMarkdown>
            </div>
            <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex justify-end">
               <button onClick={() => handleExport(true)} className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 px-6 py-2.5 rounded-xl transition-all font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                 <Download className="w-4 h-4" /> Exportar em .MD
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Strip */}
      <footer className="glass-panel border-t border-white/5 p-4 sm:p-6 rounded-2xl shrink-0 flex items-center justify-between animate-fade-in z-20 relative">
        <button 
          onClick={() => startNextRound()}
          disabled={!canContinue} 
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl transition-all font-medium border border-white/10 hover:border-white/20 shadow-md disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
          title="Inicia a próxima rodada. Se você digitou algo no cabeçalho, será incluído."
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Aprofundar (Próxima Rodada)
        </button>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-300 hover:text-white transition-colors" title="Selecionar todos os cards para o resumo final.">
             <input 
               type="checkbox"
               checked={hasSelectedAll}
               onChange={handleToggleSelectAll}
               className="w-4 h-4 rounded border-white/20 text-white focus:ring-white/30 bg-black/40 cursor-pointer accent-white"
             />
             Selecionar Tudo
          </label>
          <div className="w-px h-6 bg-white/10 mx-2"></div>
        
          <select 
             disabled={status === 'completed' || !canContinue}
            value={synthesisModel}
            onChange={(e) => setSynthesisModel(e.target.value)}
            className="bg-black/20 border border-white/10 text-zinc-300 text-sm rounded-xl px-4 py-3 focus:ring-white/30 focus:border-white/30 outline-none max-w-[220px] shadow-inner disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed backdrop-blur-md"
          >
            <option value="" disabled>Sintetizar com...</option>
            {ALL_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Split Button: Encerrar */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-stretch">
              {/* Main button */}
              <button 
                onClick={handleSynthesize}
                disabled={synthesisDisabled}
                className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 px-5 py-3 rounded-l-xl transition-all font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 border-r-0 active:scale-[0.98] relative disabled:shadow-none"
              >
                {isJudging ? <span className="animate-spin w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full"></span> : <Send className="w-5 h-5" />}
                {isJudging ? 'Resumindo...' : 'Encerrar e Sintetizar'}
              </button>

              {/* Dropdown toggle */}
              <button
                onClick={() => !synthesisDisabled && setDropdownOpen(!dropdownOpen)}
                disabled={synthesisDisabled}
                className="flex items-center bg-white hover:bg-zinc-200 text-zinc-950 px-2 py-3 rounded-r-xl transition-all border border-white/10 border-l border-l-zinc-300/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] disabled:shadow-none shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                title="Mais opções de encerramento"
              >
                <ChevronUp className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up z-50">
                <button
                  onClick={handleSynthesize}
                  disabled={synthesisDisabled}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-zinc-200 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 shrink-0 text-zinc-400" />
                  <div>
                    <div className="font-medium">Encerrar e Sintetizar</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Usa IA para resumir as respostas</div>
                  </div>
                </button>
                <div className="h-px bg-white/5" />
                <button
                  onClick={handleFullTranscript}
                  disabled={synthesisDisabled}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-zinc-200 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ScrollText className="w-4 h-4 shrink-0 text-zinc-400" />
                  <div>
                    <div className="font-medium">Encerrar e Reproduzir na Íntegra</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Exibe os textos completos selecionados</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
