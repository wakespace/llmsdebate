"use client";

import { useEffect, useState } from "react";
import { Settings, X, Server, BrainCircuit, Globe, Bot } from "lucide-react";
import { useDeliberationStore } from "@/store/useDeliberationStore";
import registryData from "@/data/models_registry.json";
import { ProviderAccordion } from "./ProviderAccordion";
import Link from "next/link";

export function SettingsSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { activeModelsIds, toggleActiveModel, personas, activePersonasIds, toggleActivePersona } = useDeliberationStore();
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-4 border-b border-white/5 shrink-0 px-6">
          <button 
            onClick={() => setActiveTab("models")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "models" 
                ? "bg-white/10 text-white border border-white/5" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            Modelos de IA
          </button>
          <button 
            onClick={() => setActiveTab("personas")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "personas" 
                ? "bg-white/10 text-white border border-white/5" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            Personas
          </button>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === "models" && (
            <div className="mb-6 animate-fade-in">
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
          )}

          {activeTab === "personas" && (
            <div className="mb-6 animate-fade-in flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">
                  Personas Customizadas
                </h3>
                <Link 
                  href="/personas/new" 
                  onClick={onClose}
                  className="bg-white text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors shadow-lg"
                >
                  + Nova Persona
                </Link>
              </div>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Associe um modelo a uma de suas personas customizadas durante o debate para direcionar o comportamento lógico e os conhecimentos do especialista. 
              </p>

              <div className="flex flex-col gap-3">
                {personas.length === 0 ? (
                  <div className="text-center p-8 border border-white/5 rounded-xl bg-white/[0.02]">
                    <p className="text-sm text-zinc-500">Você ainda não criou nenhuma Persona.</p>
                  </div>
                ) : (
                  personas.map(persona => {
                    const isActive = activePersonasIds.includes(persona.id);
                    return (
                      <div key={persona.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:border-white/20 transition-colors">
                          <div className="flex items-center justify-between">
                          <h4 className="font-medium text-zinc-200 text-sm tracking-wide truncate pr-2">{persona.name}</h4>
                          <div className="flex items-center gap-3">
                            <Link href={`/personas/${persona.id}`} onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xs font-medium underline underline-offset-2">Editar</Link>
                            <label className="relative inline-block w-9 h-5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="peer absolute w-0 h-0 opacity-0"
                                checked={isActive}
                                onChange={() => toggleActivePersona(persona.id)}
                              />
                              <span className="absolute inset-0 bg-white/10 peer-checked:bg-white rounded-full transition-all duration-300 border border-white/10 peer-checked:border-white shadow-inner"></span>
                              <span className="absolute left-1 top-1 w-3 h-3 bg-zinc-400 peer-checked:bg-zinc-900 rounded-full transition-transform duration-300 transform peer-checked:translate-x-4 shadow-sm"></span>
                            </label>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed" title={persona.description}>{persona.description}</p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
