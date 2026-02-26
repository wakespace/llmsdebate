"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useDeliberationStore } from "@/store/useDeliberationStore";

interface ModelData {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  costTier: string;
  description: string;
  strengths: string[];
}

export function ProviderAccordion({ 
  providerId, 
  title, 
  icon, 
  models = [] 
}: { 
  providerId: string; 
  title: string; 
  icon: React.ReactNode; 
  models: ModelData[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  
  const { activeModelsIds, toggleActiveModel } = useDeliberationStore();

  const activeCount = models.filter(m => activeModelsIds.includes(m.id)).length;

  if (models.length === 0) return null;

  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-xl overflow-hidden shadow-inner">
      {/* Accordion Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-zinc-400">
            {icon}
          </div>
          <span className="font-semibold text-zinc-200">{title}</span>
          <span className="text-xs bg-white/10 text-zinc-300 py-0.5 px-2 rounded-full font-medium">
            {activeCount}/{models.length} ativos
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-2 border-t border-white/5 flex flex-col gap-1 max-h-[400px] overflow-y-auto custom-scrollbar">
          {models.map(model => {
            const isActive = activeModelsIds.includes(model.id);
            const isExpanded = expandedModelId === model.id;

            return (
              <div 
                key={model.id}
                className={`flex flex-col rounded-lg border ${isActive ? 'border-white/10 bg-black/20' : 'border-transparent hover:bg-white/5'} transition-all`}
              >
                {/* Model Row Header */}
                <div className="flex flex-col p-3 cursor-pointer group" onClick={() => setExpandedModelId(isExpanded ? null : model.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 overflow-hidden">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleActiveModel(model.id); }}
                        className="shrink-0 mt-0.5"
                      >
                        <input 
                          type="checkbox" 
                          checked={isActive}
                          readOnly
                          className="w-4 h-4 rounded border-white/20 text-white focus:ring-white/30 focus:ring-offset-zinc-950 bg-black/40 cursor-pointer accent-white mix-blend-screen"
                        />
                      </button>
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                          {model.name}
                        </span>
                        
                        {/* Strengths visible without expanding */}
                        {model.strengths && model.strengths.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {model.strengths.slice(0, 3).map(s => (
                              <span key={s} className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full text-zinc-400">
                                {s}
                              </span>
                            ))}
                            {model.strengths.length > 3 && (
                               <span className="text-[10px] text-zinc-500 py-0.5">+{model.strengths.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 ml-3 gap-2">
                       {/* Cost Tier Visualizer */}
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
                       <div className="p-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                         {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Model Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 animate-fade-in text-sm text-zinc-400 leading-relaxed border-t border-white/5 mt-1 ml-9">
                    <p>{model.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
