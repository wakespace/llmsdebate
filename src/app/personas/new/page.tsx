"use client";

import { useDeliberationStore } from "@/store/useDeliberationStore";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function NewPersonaPage() {
  const router = useRouter();
  const { addPersona, setSettingsOpen } = useDeliberationStore();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    addPersona({
      id: uuidv4(),
      name: name.trim(),
      description: description.trim()
    });

    // Reopen the settings sidebar automatically so they see their new persona
    setSettingsOpen(true);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 animate-fade-in relative">
      <div className="w-full max-w-2xl bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl z-10">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" onClick={() => setSettingsOpen(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
            <ArrowLeft className="w-5 h-5 text-zinc-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Criar Nova Persona</h1>
            <p className="text-zinc-400 text-sm mt-1">Defina as características de um especialista para uso na deliberação.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold tracking-wide text-zinc-300">
              Nome da Especialidade
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Engenheiro de Software Sênior"
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center justify-between">
              Descrição do Comportamento
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-zinc-400">Enviado no System Prompt</span>
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex: Você é um engenheiro pragmático. Foque sempre na manutenibilidade do código, cite design patterns adequados e alerte sobre potenciais problemas de escalabilidade. Seja direto."
              className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all resize-none leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={!name.trim() || !description.trim()}
              className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-zinc-950 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-5 h-5" />
              Salvar Especialista
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
