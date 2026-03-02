"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp, Bot, Clock, Maximize2, Minimize2 } from "lucide-react";
import { DeliberationResponse, useDeliberationStore } from "@/store/useDeliberationStore";

interface Props {
  response: DeliberationResponse;
}

export function ResponseCard({ response }: Props) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Use selectors to avoid re-rendering ALL cards when any selection changes
  const isSelected = useDeliberationStore(state => state.selectedResponseIds.includes(response.id));
  const toggleResponseSelection = useDeliberationStore(state => state.toggleResponseSelection);
  
  if (response.error) {
    return null; // ModelColumn already handles rendering the error block
  }

  return (
    <div className={`bg-white/5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-colors backdrop-blur-md group flex flex-col w-full h-[450px] overflow-hidden ${isSelected ? 'border-zinc-300 bg-white/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'} ${isCollapsed ? '!h-[52px]' : ''}`}>
       {/* Card Meta Header */}
       <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs text-zinc-400 bg-black/20 ${isSelected ? 'border-zinc-300/30' : 'border-white/5'}`}>
         
         {/* Left Side: Checkbox and Identity */}
         <div className="flex items-center gap-3">
           <input 
             type="checkbox" 
             checked={isSelected}
             onChange={() => toggleResponseSelection(response.id)}
             title="Incluir esta resposta na síntese final."
             className="w-4 h-4 rounded border-white/20 text-white focus:ring-white/30 bg-black/40 cursor-pointer accent-white"
           />
           <div className="flex items-center gap-1.5 font-medium tracking-wide">
             <Bot className="w-3.5 h-3.5 text-zinc-300" />
             Rodada {response.round}
             {response.personaName && <span className="text-zinc-500 font-normal ml-1">・ {response.personaName}</span>}
           </div>
         </div>

         {/* Right Side: Time and Collapse Toggle */}
         <div className="flex items-center gap-3">
           {response.durationMs && (
              <div className="flex items-center gap-1 opacity-60">
                <Clock className="w-3 h-3" />
                {Math.round(response.durationMs / 1000)}s
              </div>
           )}
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="opacity-50 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10"
             title={isCollapsed ? "Expandir Card" : "Colapsar Card"}
           >
             {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
           </button>
         </div>
       </div>

       {/* Scrollable Body - Expands naturally up to the max height bound */}
       {!isCollapsed && (
         <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0 bg-transparent">
         
         {/* Analysis (Collapsible) */}
         <div className="border-b border-white/5 shrink-0">
           <button 
             onClick={() => setAnalysisOpen(!analysisOpen)}
             className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors group-hover:bg-white/[0.02]"
           >
             <span className="font-medium text-zinc-300 text-sm tracking-wide">Análise Detalhada</span>
             {analysisOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
           </button>
           
           {analysisOpen && (
             <div className="px-5 pb-4 pt-1 text-sm text-zinc-300/90 prose prose-invert prose-sm max-w-none animate-fade-in">
               <ReactMarkdown>{response.analysis || "_Sem análise disponível_"}</ReactMarkdown>
             </div>
           )}
         </div>

         {/* Conclusion (Always Visible) */}
         <div className="px-5 py-5 bg-black/10 flex-1">
           <h4 className="font-semibold text-zinc-100 text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 inline-block shadow-[0_0_5px_rgba(255,255,255,0.8)]"></span>
             Conclusão Final
           </h4>
           <div className="text-sm text-zinc-200 prose prose-invert prose-sm max-w-none font-medium leading-relaxed pb-4">
             <ReactMarkdown>{response.conclusion || "_Sem conclusão disponível_"}</ReactMarkdown>
           </div>
          </div>
         </div>
       )}
    </div>
  );
}
