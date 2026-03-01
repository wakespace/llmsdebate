import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_SYSTEM_PROMPT = "Você é um especialista participando num Sistema de Deliberação Assistida por LLMs. Responda SEMPRE em Português do Brasil. IMPORTANTE: Estruture a sua resposta usando EXATAMENTE duas marcações Markdown: '## Análise' e '## Conclusão Final'. Seja claro, estruturado e profissional.";

export interface DeliberationResponse {
  id: string; // unique per response
  round: number;
  modelId: string;
  modelName: string;
  text: string;
  analysis: string;
  conclusion: string;
  error?: string;
  durationMs?: number;
}

export type DeliberationStatus = 'idle' | 'loading' | 'deliberating' | 'completed';
export type ColumnStatus = 'idle' | 'loading' | 'success' | 'error';

export interface Persona {
  id: string;
  name: string;
  description: string;
}

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "persona-pm",
    name: "Gestor de Produto (Product Manager)",
    description: "Atue como um Gestor de Produto (Product Manager) sênior e atue como um dos juízes nesta deliberação. O seu foco principal é o valor para o negócio, a viabilidade do produto e a satisfação das necessidades do utilizador final. Ao avaliar as propostas ou respostas, verifique se elas resolvem o problema real do cliente de forma eficiente e se estão alinhadas com os objetivos estratégicos. Questione os outros especialistas caso proponham soluções que sejam tecnicamente perfeitas, mas demasiado complexas, caras ou que ignorem a experiência do utilizador. A sua responsabilidade é garantir que a solução final faz sentido para o mercado e para o negócio."
  },
  {
    id: "persona-arch",
    name: "Arquiteto de Software (Software Architect)",
    description: "Atue como um Arquiteto de Software sênior e seja um dos avaliadores nesta deliberação. A sua responsabilidade é avaliar a estrutura, escalabilidade, manutenibilidade e os padrões de design (design patterns) das soluções propostas. Olhe para o 'big picture' (panorama geral). Identifique possíveis estrangulamentos arquitetónicos, acoplamento excessivo ou falhas de escalabilidade a longo prazo. Debata com os outros agentes para garantir que a resposta final escolhe tecnologias e estruturas que sejam sustentáveis, modulares e preparadas para o futuro."
  },
  {
    id: "persona-backend",
    name: "Engenheiro de Backend (Backend Engineer)",
    description: "Atue como um Engenheiro de Backend especializado em performance e bases de dados, participando como juiz nesta deliberação. O seu foco é a eficiência algorítmica, o processamento de dados, a lógica de negócio e a integração de APIs. Ao ler as propostas, procure falhas de otimização, concorrência, latência ou problemas na modelação de dados. Não aceite soluções que não tratem adequadamente o consumo de recursos (CPU, memória). Ajude o grupo a refinar a solução para que o 'motor' do sistema seja rápido e impecável."
  },
  {
    id: "persona-frontend",
    name: "Engenheiro de Frontend (Frontend Engineer)",
    description: "Atue como um Engenheiro de Frontend especializado em UI/UX e performance no browser. Como juiz nesta deliberação, o seu objetivo é garantir que as soluções consideram a interação com o utilizador, a acessibilidade (a11y), a responsividade e a performance no lado do cliente. Critique abordagens que prejudiquem o tempo de carregamento ou que criem estados inconsistentes na interface. Garanta que a solução final respeita as melhores práticas da web ou mobile e oferece uma experiência fluida."
  },
  {
    id: "persona-qa",
    name: "Engenheiro de Qualidade e Testes (QA / SDET)",
    description: "Atue como um Engenheiro de Qualidade de Software (QA/SDET) altamente rigoroso. O seu papel neste painel de debate é encontrar falhas, casos extremos (edge cases) e potenciais bugs nas soluções propostas pelos outros agentes. Pense no que acontece se os dados de entrada forem inválidos, se a rede falhar ou se os limites do sistema forem testados. Exija que a solução final contemple estratégias de mitigação de erros, cobertura de testes e robustez. Não deixe a equipa aprovar uma solução 'caminho feliz' (happy path) sem contemplar o tratamento de exceções."
  },
  {
    id: "persona-sec",
    name: "Engenheiro de Segurança (Security Engineer / AppSec)",
    description: "Atue como um Engenheiro de Segurança da Informação (AppSec). O seu único objetivo nesta deliberação é identificar vulnerabilidades, riscos de privacidade e falhas de conformidade (como GDPR). Analise as respostas em busca de potenciais injeções de SQL, XSS, falhas de autenticação, criptografia inadequada ou exposição indevida de dados sensíveis (PII). Desafie os outros agentes sempre que priorizarem a facilidade de desenvolvimento em detrimento da segurança. A solução final tem de ser inviolável."
  },
  {
    id: "persona-sre",
    name: "Engenheiro de Confiabilidade de Sites (SRE / DevOps)",
    description: "Atue como um Engenheiro de Confiabilidade de Sites (SRE / DevOps) e participe como juiz na deliberação. A sua lente de avaliação foca-se na infraestrutura, CI/CD, monitorização, resiliência e disponibilidade em produção (SLAs/SLOs). O código funcionar na máquina local não lhe interessa; interessa-lhe como ele se comporta em produção sob carga pesada. Verifique se a solução considera tolerância a falhas (fault tolerance), estratégias de rollback, logs e métricas de observabilidade. Guie o debate para garantir que a resposta final propõe um sistema altamente disponível."
  }
];

interface State {
  // Personas State
  hasSeededPersonas: boolean;
  prompt: string;
  systemPrompt: string; // Persisted
  activeSystemPrompt: string; // Used for the current run (might be draft)
  roundPrompt: string;
  round: number;
  responses: DeliberationResponse[];
  selectedModels: string[];
  status: DeliberationStatus;
  columnStatus: Record<string, ColumnStatus>; // modelId -> status
  summarizationEnabled: boolean;
  synthesisResult: string | null;
  fullTranscriptResult: string | null;
  selectedResponseIds: string[];
  isJudging: boolean;
  activeModelsIds: string[];
  isSettingsOpen: boolean; // Controls Settings sidebar
  
  // Personas State
  personas: Persona[];
  activePersonasIds: string[];
  modelPersonas: Record<string, string>; // modelId -> personaId
  
  // Actions
  setSettingsOpen: (open: boolean) => void;
  setPrompt: (prompt: string) => void;
  setSystemPrompt: (systemPrompt: string) => void;
  setRoundPrompt: (roundPrompt: string) => void;
  toggleModel: (modelId: string) => void;
  toggleActiveModel: (modelId: string) => void;
  setSummarizationEnabled: (enabled: boolean) => void;
  startDeliberation: (draftSystemPrompt?: string) => void;
  startNextRound: (draftSystemPrompt?: string) => void;
  endDeliberation: (synthesisResult: string) => void;
  endWithFullTranscript: () => void;
  setColumnStatus: (modelId: string, status: ColumnStatus) => void;
  addResponse: (response: DeliberationResponse) => void;
  toggleResponseSelection: (id: string) => void;
  selectAllResponses: () => void;
  clearResponseSelection: () => void;
  clearSynthesis: () => void;
  clearFullTranscript: () => void;
  reset: () => void;
  requestJudgeSynthesis: (judgeModelId: string) => Promise<void>;

  // Personas Actions
  addPersona: (persona: Persona) => void;
  updatePersona: (id: string, data: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
  toggleActivePersona: (id: string) => void;
  setModelPersona: (modelId: string, personaId: string) => void;
}

export const useDeliberationStore = create<State>()(
  persist(
    (set, get) => ({
      prompt: '',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      activeSystemPrompt: DEFAULT_SYSTEM_PROMPT,
      roundPrompt: '',
      round: 1,
      responses: [],
      selectedModels: ['gemini-3-flash-preview-high'], // default selected
      activeModelsIds: [
        'gemini-3-flash-preview-high',
        'openrouter/qwen/qwen3-vl-30b-a3b-thinking',
        'openrouter/upstage/solar-pro-3:free'
      ],
      status: 'idle',
      columnStatus: {},
      summarizationEnabled: false,
      synthesisResult: null,
      fullTranscriptResult: null,
      selectedResponseIds: [],
      isJudging: false,
      isSettingsOpen: false,

      // Personas Initial State
      hasSeededPersonas: false,
      personas: [],
      activePersonasIds: [],
      modelPersonas: {},

      // Actions
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setPrompt: (prompt) => set({ prompt }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
      setRoundPrompt: (roundPrompt: string) => set({ roundPrompt }),
      
      toggleModel: (modelId) => set((state) => {
        const selected = state.selectedModels.includes(modelId)
          ? state.selectedModels.filter(id => id !== modelId)
          : [...state.selectedModels, modelId];
        return { selectedModels: selected };
      }),

      toggleActiveModel: (modelId) => set((state) => {
        const active = state.activeModelsIds.includes(modelId)
          ? state.activeModelsIds.filter(id => id !== modelId)
          : [...state.activeModelsIds, modelId];
        
        // If we disabled a model, make sure it's removed from the current selection too
        const newSelected = state.selectedModels.filter(id => id !== modelId || active.includes(modelId));
        return { activeModelsIds: active, selectedModels: newSelected };
      }),

      setSummarizationEnabled: (enabled) => set({ summarizationEnabled: enabled }),

      startDeliberation: (draftSystemPrompt?: string) => set((state) => {
        if (!state.prompt.trim() || state.selectedModels.length === 0) return state;
        
        const newColumnStatus: Record<string, ColumnStatus> = {};
        state.selectedModels.forEach(m => newColumnStatus[m] = 'loading');
        
        return { 
          status: 'deliberating', 
          round: 1, 
          responses: [],
          columnStatus: newColumnStatus,
          synthesisResult: null,
          roundPrompt: '', // clear for next round
          activeSystemPrompt: draftSystemPrompt || state.systemPrompt,
        };
      }),

      startNextRound: (draftSystemPrompt?: string) => set((state) => {
        if (state.selectedModels.length === 0) return state;
        
        const newColumnStatus: Record<string, ColumnStatus> = {};
        state.selectedModels.forEach(m => newColumnStatus[m] = 'loading');

        return {
          status: 'deliberating',
          round: state.round + 1,
          columnStatus: newColumnStatus,
          roundPrompt: '', // clear so user can type new one later
          activeSystemPrompt: draftSystemPrompt || state.systemPrompt,
        };
      }),

      endDeliberation: (synthesisResult) => set({ 
        status: 'completed',
        synthesisResult,
        columnStatus: {}
      }),

      endWithFullTranscript: () => set((state) => {
        const selectedResponses = state.responses
          .filter(r => !r.error && state.selectedResponseIds.includes(r.id))
          .sort((a, b) => a.round - b.round || a.modelName.localeCompare(b.modelName));

        const transcript = selectedResponses
          .map(r => `## ${r.modelName} — Rodada ${r.round}\n\n### Análise\n${r.analysis}\n\n### Conclusão Final\n${r.conclusion}`)
          .join('\n\n---\n\n');

        return {
          status: 'completed',
          fullTranscriptResult: transcript || 'Nenhuma resposta selecionada.',
          columnStatus: {}
        };
      }),

      requestJudgeSynthesis: async (judgeModelId: string) => {
        const state = get();
        if (state.selectedResponseIds.length === 0) return;
        
        set({ isJudging: true });

        const selectedResponses = state.responses
          .filter(r => !r.error && state.selectedResponseIds.includes(r.id))
          .sort((a, b) => a.round - b.round || a.modelName.localeCompare(b.modelName));

        const transcript = selectedResponses
          .map(r => `## ${r.modelName} — Rodada ${r.round}\n\n### Análise\n${r.analysis}\n\n### Conclusão Final\n${r.conclusion}`)
          .join('\n\n---\n\n');

        try {
          const res = await fetch('/api/judge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: state.prompt,
              transcript,
              judgeModel: judgeModelId
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const msg = errData.error || `Erro na síntese O juiz falhou (HTTP ${res.status})`;
            alert(msg);
            set({ isJudging: false });
            return;
          }

          const data = await res.json();
          set({ 
            synthesisResult: data.text,
            status: 'completed',
            isJudging: false,
            columnStatus: {}
          });
        } catch (err) {
          console.error(err);
          alert("Ocorreu um erro de rede ao processar o julgamento.");
          set({ isJudging: false });
        }
      },

      setColumnStatus: (modelId, status) => set((state) => ({
        columnStatus: { ...state.columnStatus, [modelId]: status }
      })),

      addResponse: (response) => set((state) => {
        return {
          responses: [...state.responses, response],
          selectedResponseIds: [...state.selectedResponseIds, response.id]
        };
      }),

      toggleResponseSelection: (id) => set((state) => ({
        selectedResponseIds: state.selectedResponseIds.includes(id) 
           ? state.selectedResponseIds.filter(rid => rid !== id)
           : [...state.selectedResponseIds, id]
      })),
      
      selectAllResponses: () => set((state) => ({
        selectedResponseIds: state.responses.filter(r => !r.error).map(r => r.id)
      })),

      clearResponseSelection: () => set({ selectedResponseIds: [] }),
      
      clearSynthesis: () => set({ synthesisResult: null, status: 'idle' }),
      clearFullTranscript: () => set({ fullTranscriptResult: null, status: 'idle' }),

      reset: () => set({
        prompt: '',
        roundPrompt: '',
        activeSystemPrompt: DEFAULT_SYSTEM_PROMPT,
        round: 1,
        responses: [],
        selectedModels: ['gemini-3-flash-preview'],
        status: 'idle',
        columnStatus: {},
        synthesisResult: null,
        fullTranscriptResult: null,
        selectedResponseIds: []
      }),

      // Personas Actions
      addPersona: (persona) => set((state) => ({
        personas: [...state.personas, persona],
        activePersonasIds: [...state.activePersonasIds, persona.id]
      })),
      
      updatePersona: (id, data) => set((state) => ({
        personas: state.personas.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      
      deletePersona: (id) => set((state) => {
        const newPersonas = state.personas.filter(p => p.id !== id);
        const newActive = state.activePersonasIds.filter(pid => pid !== id);
        
        // Remove from modelPersonas mapping
        const newModelPersonas = { ...state.modelPersonas };
        Object.keys(newModelPersonas).forEach(modelId => {
          if (newModelPersonas[modelId] === id) {
             delete newModelPersonas[modelId];
          }
        });

        return { 
          personas: newPersonas, 
          activePersonasIds: newActive,
          modelPersonas: newModelPersonas
        };
      }),
      
      toggleActivePersona: (id) => set((state) => {
        const active = state.activePersonasIds.includes(id)
          ? state.activePersonasIds.filter(pid => pid !== id)
          : [...state.activePersonasIds, id];
        
        // Se desativou, remover do mapping modelPersonas
        const newModelPersonas = { ...state.modelPersonas };
        if (!active.includes(id)) {
           Object.keys(newModelPersonas).forEach(modelId => {
             if (newModelPersonas[modelId] === id) {
               delete newModelPersonas[modelId];
             }
           });
        }
        
        return { activePersonasIds: active, modelPersonas: newModelPersonas };
      }),
      
      setModelPersona: (modelId, personaId) => set((state) => {
        const newMapping = { ...state.modelPersonas };
        if (!personaId || personaId === '') {
           delete newMapping[modelId];
        } else {
           newMapping[modelId] = personaId;
        }
        return { modelPersonas: newMapping };
      })
    }),
    {
      name: 'llm-deliberation-storage',
      partialize: (state) => ({ 
        prompt: state.prompt,
        systemPrompt: state.systemPrompt,
        roundPrompt: state.roundPrompt,
        round: state.round,
        responses: state.responses,
        selectedModels: state.selectedModels,
        activeModelsIds: state.activeModelsIds,
        summarizationEnabled: state.summarizationEnabled,
        synthesisResult: state.synthesisResult,
        fullTranscriptResult: state.fullTranscriptResult,
        selectedResponseIds: state.selectedResponseIds,
        hasSeededPersonas: state.hasSeededPersonas,
        personas: state.personas,
        activePersonasIds: state.activePersonasIds,
        modelPersonas: state.modelPersonas
      }),
      onRehydrateStorage: () => () => {
        setTimeout(() => {
          const state = useDeliberationStore.getState();
          if (state.status === 'deliberating' || state.status === 'loading') {
            useDeliberationStore.setState({ status: 'idle', columnStatus: {} });
          }
          if (!state.hasSeededPersonas) {
             const missingPersonas = DEFAULT_PERSONAS.filter(
               dp => !state.personas.some(p => p.id === dp.id)
             );
             useDeliberationStore.setState({
                hasSeededPersonas: true,
                personas: [...state.personas, ...missingPersonas],
                activePersonasIds: [...new Set([...state.activePersonasIds, ...missingPersonas.map(p => p.id)])]
             });
          }
        }, 0);
      }
    }
  )
);
