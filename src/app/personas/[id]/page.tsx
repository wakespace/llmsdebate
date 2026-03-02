"use client";

import { useDeliberationStore } from "@/store/useDeliberationStore";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditPersonaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { personas, updatePersona, deletePersona, setSettingsOpen } = useDeliberationStore();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  useEffect(() => {
    const existingPersona = personas.find(p => p.id === id);
    if (!existingPersona) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(existingPersona.name);
    setDescription(existingPersona.description);
  }, [id, personas, router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    updatePersona(id, {
      name: name.trim(),
      description: description.trim()
    });

    setSettingsOpen(true);
    router.push("/");
  };
  
  const handleDelete = () => {
    if (confirm("Tem certeza que deseja remover esta especialidade?")) {
      deletePersona(id);
      setSettingsOpen(true);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 animate-fade-in relative">
      <div className="w-full max-w-2xl bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl z-10">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" onClick={() => setSettingsOpen(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
              <ArrowLeft className="w-5 h-5 text-zinc-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Editar Persona</h1>
              <p className="text-zinc-400 text-sm mt-1">Atualize as características desta especialidade.</p>
            </div>
          </div>
          
          <button 
             type="button"
             onClick={handleDelete}
             className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-transparent hover:border-red-400/20"
          >
            <Trash2 className="w-4 h-4" />
            Remover
          </button>
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
              Salvar Alterações
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
