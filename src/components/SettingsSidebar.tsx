"use client";

import { useEffect, useState } from "react";
import { Settings, X, Server, BrainCircuit, Globe, Bot } from "lucide-react";
import { useDeliberationStore } from "@/store/useDeliberationStore";
import registryData from "@/data/models_registry.json";
import { ProviderAccordion } from "./ProviderAccordion";

export function SettingsSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { activeModelsIds, toggleActiveModel } = useDeliberationStore();
  const [activeTab, setActiveTab] = useState("models");

  // Prevent scrolling on background when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-950 border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0 animate-slide-in-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg border border-white/10">
              <Settings className="w-5 h-5 text-zinc-100" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white drop-shadow-sm">Configurações</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase mb-4">
              Modelos e Provedores
            </h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Expanda os provedores abaixo para ativar ou desativar os modelos. Os modelos ativados ficarão disponíveis no seu menu de Especialistas na tela principal.
            </p>

            <div className="flex flex-col gap-3">
              <ProviderAccordion 
                providerId="openrouter" 
                title="OpenRouter" 
                icon={<Globe className="w-4 h-4" />}
                models={registryData.openrouter} 
              />
              <ProviderAccordion 
                providerId="openai" 
                title="OpenAI" 
                icon={<BrainCircuit className="w-4 h-4" />}
                models={registryData.openai} 
              />
              <ProviderAccordion 
                providerId="gemini" 
                title="Google Gemini" 
                icon={<Bot className="w-4 h-4" />}
                models={registryData.gemini} 
              />
              <ProviderAccordion 
                providerId="perplexity" 
                title="Perplexity" 
                icon={<Server className="w-4 h-4" />}
                models={registryData.perplexity} 
              />
              <ProviderAccordion 
                providerId="local" 
                title="Local / Offline (LM Studio)" 
                icon={<Server className="w-4 h-4" />}
                models={registryData.local} 
              />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
