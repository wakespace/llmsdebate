"use client";

import { useDeliberationStore } from "@/store/useDeliberationStore";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPromptPage() {
  const router = useRouter();
  const { addSystemPrompt, setSettingsOpen } = useDeliberationStore();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<'initial' | 'round'>('initial');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    addSystemPrompt({
      name: name.trim(),
      content: description.trim(),
      category
    });

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
            <h1 className="text-2xl font-bold tracking-tight text-white">Criar Novo Prompt de Sistema</h1>
            <p className="text-zinc-400 text-sm mt-1">Defina novas matrizes de comportamento lógico e fluxos de instrução.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold tracking-wide text-zinc-300">
              Nome de Identificação
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Debate Agressivo (Rodadas Finais)"
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-medium"
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold tracking-wide text-zinc-300 mb-1">
              Categoria
            </label>
            <div className="flex gap-4">
               <label className={`flex-1 flex gap-3 p-4 rounded-xl border cursor-pointer transition-all ${category === 'initial' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-black/40 hover:bg-white/5'}`}>
                 <input type="radio" value="initial" className="sr-only" checked={category === 'initial'} onChange={() => setCategory('initial')} />
                 <div>
                   <h4 className="font-semibold text-zinc-200">Inicial</h4>
                   <p className="text-xs text-zinc-500 mt-1">Acionado apenas na Rodada 1 para apresentação de problemas.</p>
                 </div>
               </label>
               <label className={`flex-1 flex gap-3 p-4 rounded-xl border cursor-pointer transition-all ${category === 'round' ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-black/40 hover:bg-white/5'}`}>
                 <input type="radio" value="round" className="sr-only" checked={category === 'round'} onChange={() => setCategory('round')} />
                 <div>
                   <h4 className="font-semibold text-zinc-200">Rodada de Debate</h4>
                   <p className="text-xs text-zinc-500 mt-1">Usado para conflitos 2+ requerendo formatação e síntese de histórico.</p>
                 </div>
               </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center justify-between">
              Comando Dinâmico de Sistema
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-zinc-400">Context Window Header</span>
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex: Leia o histórico e tente refutar rigorosamente cada resposta anterior procurando viéses."
              className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all resize-none leading-relaxed"
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
              Processar e Salvar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
