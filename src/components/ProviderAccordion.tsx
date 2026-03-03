"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Gavel, Plus, Trash2 } from "lucide-react";
import { useDeliberationStore } from "@/store/useDeliberationStore";

interface ModelData {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  costTier: string;
  description?: string;
  strengths: string[];
}

export function ProviderAccordion({ 
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
  
  const { activeInstances, addModelInstance, removeModelInstance, setInstancePersona, judgeModelsIds, toggleJudgeModel, personas } = useDeliberationStore();

  const activeCount = activeInstances.filter(inst => models.some(m => m.id === inst.modelId)).length;

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
            const instances = activeInstances.filter(inst => inst.modelId === model.id);
            const isActive = instances.length > 0;
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
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2">
                           <span className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                             {model.name}
                           </span>
                           {isActive && (
                             <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-medium">
                               {instances.length}x ativo{instances.length > 1 ? 's' : ''}
                             </span>
                           )}
                        </div>
                        
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
                       <div className="flex items-center gap-2">
                         {/* Toggle Judge Visualizer */}
                         <button
                           onClick={(e) => { e.stopPropagation(); toggleJudgeModel(model.id); }}
                           title={judgeModelsIds.includes(model.id) ? "Remover de Juiz da Síntese" : "Definir como Juiz da Síntese"}
                           className={`p-1.5 rounded-md transition-all border ${
                             judgeModelsIds.includes(model.id)
                               ? 'bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                               : 'bg-white/5 text-zinc-500 border-transparent hover:bg-white/10 hover:text-zinc-300'
                           }`}
                         >
                           <Gavel className="w-4 h-4" />
                         </button>

                         {/* Cost Tier Visualizer */}
                         <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-widest h-[26px] flex items-center ${
                           model.free 
                             ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 line-through decoration-emerald-500/50' 
                             : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                         }`}>
                           {model.free ? '0' : (
                             model.costTier === 'barato' ? '$' : 
                             model.costTier === 'moderado' ? '$$' : '$$$'
                           )}
                         </span>
                       </div>
                       
                       <div className="p-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                         {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                       </div>
                     </div>
                  </div>
                </div>

                {/* Model Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 animate-fade-in text-sm text-zinc-400 leading-relaxed border-t border-white/5 mt-1">
                    <p>{model.description}</p>
                    
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Instâncias Ativas ({instances.length})</h4>
                        <button 
                          onClick={(e) => { e.stopPropagation(); addModelInstance(model.id); }} 
                          className="flex items-center gap-1 text-[10px] bg-white text-zinc-950 px-2 py-1 rounded font-semibold hover:bg-zinc-200 transition-colors shadow-sm"
                        >
                           <Plus className="w-3 h-3" /> ADICIONAR
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                         {instances.length === 0 && <span className="text-xs text-zinc-600 italic">Nenhuma instância ativa.</span>}
                         {instances.map((inst, idx) => (
                            <div key={inst.id} className="flex flex-col gap-2 p-3 rounded-lg bg-black/40 border border-white/10 shadow-inner">
                               <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold tracking-wide text-zinc-200"># Instância {idx + 1}</span>
                                  <button onClick={(e) => { e.stopPropagation(); removeModelInstance(inst.id); }} className="text-red-500/70 hover:text-red-400 transition-colors hover:bg-red-500/10 p-1.5 rounded-md">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                               <div className="flex flex-col gap-1.5">
                                 <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Persona Customizada (Opcional)</label>
                                 <select
                                    value={inst.personaId || ""}
                                    onChange={(e) => { e.stopPropagation(); setInstancePersona(inst.id, e.target.value); }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-2 text-xs text-zinc-300 outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
                                 >
                                    <option value="">Nenhuma (Comportamento Padrão)</option>
                                    {personas.map(p => (
                                       <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                 </select>
                               </div>
                            </div>
                         ))}
                      </div>
                    </div>
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
