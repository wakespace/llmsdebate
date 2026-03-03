"use client";

import { useDeliberationStore } from "@/store/useDeliberationStore";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { ResponseCard } from "./ResponseCard";

interface Props {
  instanceId: string;
}

export function ModelColumn({ instanceId }: Props) {
  const { 
    responses, 
    columnStatus, 
    round, 
    status: globalStatus, 
    activeInstances,
    setInstancePersona, 
    personas 
  } = useDeliberationStore();
  
  const modelResponses = responses.filter(r => r.modelId === instanceId).sort((a,b) => a.round - b.round);
  const status = columnStatus[instanceId] || 'idle';
  
  const instance = activeInstances.find(i => i.id === instanceId);
  const actualModelId = instance?.modelId || instanceId;

  // Try to get a friendly name from the first response, or fallback to id
  const friendlyName = modelResponses.length > 0 
    ? modelResponses[0].modelName 
    : actualModelId.split('/').pop() || actualModelId;

  return (
    <div className="flex flex-col gap-4 min-w-[340px] max-w-[400px] flex-1 shrink-0 animate-fade-in relative z-10 transition-all duration-500 ease-out">
      
      {/* Column Header */}
      <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-lg shrink-0 flex items-center justify-between sticky top-0 z-20">
        <div className="flex flex-col flex-1 min-w-0 pr-4">
          <h2 className="font-medium text-zinc-100 truncate tracking-wide" title={friendlyName}>
            {friendlyName}
          </h2>
          
          {/* Persona Selector */}
          {instance && (
            <div className="mt-2">
              <select 
                title="Selecione uma especialidade/persona"
                disabled={status === 'loading' || globalStatus === 'deliberating'}
                value={instance.personaId || ""}
                onChange={(e) => setInstancePersona(instanceId, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              >
                <option value="">Sem Persona (Padrão)</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Status Indicator */}
        <div className="shrink-0 flex items-center justify-center">
          {status === 'loading' && <Loader2 className="w-5 h-5 text-white animate-spin opacity-80" />}
          {status === 'success' && <CheckCircle2 className="w-5 h-5 text-zinc-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />}
          {status === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />}
        </div>
      </div>

      {/* Responses Area - Grid slots */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: round }, (_, i) => i + 1).map((r) => {
           const res = modelResponses.find(resp => resp.round === r);
           const isCurrentRound = round === r;
           const isProcessingThisColumn = isCurrentRound && (status === 'loading' || status === 'error');
           const latestResponseError = modelResponses[modelResponses.length - 1]?.error;

           // Helper wrapper to enforce exact grid height per round for alignment.
           // Because the parent ModelColumn now scrolls vertically, 
           // we can fix these back to exact heights to maintain horizontal unity across columns.
           const SlotWrapper = ({ children }: { children: React.ReactNode }) => (
             <div className="h-[450px] shrink-0 w-full flex flex-col justify-start relative">
               {children}
             </div>
           );

           if (res) {
             // If this response is an error, render the error card directly
             if (res.error) {
               return (
                 <SlotWrapper key={`${r}-err-wrap-${res.id}`}>
                   <div key={`${r}-err-${res.id}`} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex gap-3 shadow-[0_0_15px_rgba(239,68,68,0.05)] items-start w-full h-full max-h-[450px]">
                     <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                     <p>{res.error}</p>
                   </div>
                 </SlotWrapper>
               );
             }
             return (
               <SlotWrapper key={`${r}-res-${res.id}`}>
                 <ResponseCard response={res} />
               </SlotWrapper>
             );
           }

           if (isProcessingThisColumn) {
             if (status === 'loading') {
               return (
                 <SlotWrapper key={`${r}-loading`}>
                   <div className="bg-white/5 rounded-xl p-5 border border-white/5 animate-pulse flex flex-col gap-3 backdrop-blur-sm w-full h-full max-h-[450px]">
                     <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
                     <div className="h-3 bg-white/5 rounded w-full"></div>
                     <div className="h-3 bg-white/5 rounded w-5/6"></div>
                     <div className="h-3 bg-white/5 rounded w-4/6"></div>
                   </div>
                 </SlotWrapper>
               );
             }

             if (status === 'error' && latestResponseError) {
               return (
                 <SlotWrapper key={`${r}-error`}>
                   <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex gap-3 shadow-[0_0_15px_rgba(239,68,68,0.05)] items-start w-full h-full max-h-[450px]">
                     <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                     <p>{latestResponseError || "Falha ao obter resposta do modelo nesta rodada."}</p>
                   </div>
                 </SlotWrapper>
               );
             }
           }

           // Empty placeholder — only render if OTHER models have responses for this round,
           // to preserve vertical alignment across columns when this model skipped a round.
           // If nobody has responded yet (e.g. before deliberation starts), render nothing.
           const anyModelHasResponseForRound = responses.some(resp => resp.round === r && !resp.error);
           if (anyModelHasResponseForRound) {
             return <SlotWrapper key={`${r}-empty`}><div className="opacity-0 w-full h-full pointer-events-none" /></SlotWrapper>;
           }
           return null;
        })}
      </div>
      
    </div>
  );
}
