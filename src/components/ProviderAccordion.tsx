"use client";

import { useState } from "react";
import { ChevronDown, Gavel } from "lucide-react";
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
  
  const { activeInstances, setModelInstanceCount, judgeModelsIds, toggleJudgeModel } = useDeliberationStore();

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
            const instanceCount = instances.length;

            return (
              <div 
                key={model.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${instanceCount > 0 ? 'border-white/10 bg-black/20' : 'border-transparent hover:bg-white/5'}`}
              >
                {/* Model Info */}
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate transition-colors ${instanceCount > 0 ? 'text-zinc-100' : 'text-zinc-400'}`}>
                      {model.name}
                    </span>
                  </div>
                  
                  {/* Strengths */}
                  {model.strengths && model.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
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

                {/* Right-side controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Instance Count Dropdown */}
                  <select
                    value={instanceCount}
                    onChange={(e) => {
                      e.stopPropagation();
                      setModelInstanceCount(model.id, parseInt(e.target.value));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title="Número de instâncias"
                    className={`w-[52px] text-center bg-white/5 border rounded-md px-1 py-1.5 text-xs outline-none focus:ring-1 focus:ring-white/20 cursor-pointer transition-all appearance-none ${
                      instanceCount > 0
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                        : 'border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>

                  {/* Toggle Judge */}
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

                  {/* Cost Tier */}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
