import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ALL_MODELS, isDefaultJudge, type ModelInfo } from '@/lib/models';
import registryData from "@/data/models_registry.json";

export const DEFAULT_SYSTEM_PROMPT = "Você é um especialista participando num Sistema de Deliberação Assistida por LLMs. Responda SEMPRE em Português do Brasil. IMPORTANTE: Estruture a sua resposta usando EXATAMENTE duas marcações Markdown: '## Análise' e '## Conclusão Final'. Seja claro, estruturado e profissional.";

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  category: 'initial' | 'round';
}

export interface ModelInstance {
  id: string;
  modelId: string;
  personaId?: string;
}

export interface DeliberationResponse {
  id: string; // unique per response
  round: number;
  modelId: string;
  modelName: string;
  text: string;
  analysis: string;
  conclusion: string;
  personaName?: string;
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
  activeSystemPrompt: string; // Used for the prompt: string;
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
  
  // Synthesis Preflight
  isSynthesisModalOpen: boolean;
  pendingSynthesisModelId: string | null;
  activeModelsIds: string[];
  judgeModelsIds: string[];
  hasSeededJudgeModels: boolean;
  isSettingsOpen: boolean; // Controls Settings sidebar
  isConfirmModalOpen: boolean;
  pendingSystemPrompt: string;
  pendingAction: 'start' | 'next' | null;
  
  // Prompts State
  hasSeededPrompts: boolean;
  systemPrompts: SystemPrompt[];
  activeInitialPromptId: string;
  activeRoundPromptId: string;
  
  // Personas State
  personas: Persona[];
  activePersonasIds: string[];
  modelPersonas: Record<string, string>; // Legacy modelId -> personaId (deprecated)
  
  // Model Instances (replaces activeModelsIds for more granular control)
  activeInstances: ModelInstance[];
  hasMigratedInstances: boolean;
  
  // Actions
  setSettingsOpen: (open: boolean) => void;
  setPrompt: (prompt: string) => void;
  setRoundPrompt: (prompt: string) => void;
  
  toggleModel: (modelId: string) => void; // Legacy selection (deprecated)
  toggleActiveModel: (modelId: string) => void; // Legacy toggle (deprecated)
  
  addModelInstance: (modelId: string) => void;
  addAllModelInstances: (modelIds: string[]) => void;
  removeModelInstance: (instanceId: string) => void;
  setModelInstanceCount: (modelId: string, count: number) => void;
  clearAllInstances: () => void;
  setInstancePersona: (instanceId: string, personaId?: string) => void;
  toggleInstanceSelection: (instanceId: string) => void;
  
  toggleJudgeModel: (modelId: string) => void;
  setSummarizationEnabled: (enabled: boolean) => void;
  startDeliberation: (draftSystemPrompt?: string) => void;
  startNextRound: (draftSystemPrompt?: string) => void;
  confirmDeliberation: () => void;
  cancelDeliberation: () => void;
  endDeliberation: (synthesisResult: string) => void;
  endWithFullTranscript: () => void;
  
  openSynthesisModal: (modelId: string) => void;
  cancelSynthesisModal: () => void;
  setColumnStatus: (modelId: string, status: ColumnStatus) => void;
  addResponse: (response: DeliberationResponse) => void;
  toggleResponseSelection: (id: string) => void;
  selectAllResponses: () => void;
  clearResponseSelection: () => void;
  clearSynthesis: () => void;
  clearFullTranscript: () => void;
  reset: () => void;
  requestJudgeSynthesis: (judgeModelId: string) => Promise<void>;

  // Prompts Actions
  addSystemPrompt: (prompt: Omit<SystemPrompt, 'id'>) => void;
  updateSystemPrompt: (id: string, data: Partial<SystemPrompt>) => void;
  deleteSystemPrompt: (id: string) => void;
  setActivePrompt: (id: string, category: 'initial' | 'round') => void;

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
      activeSystemPrompt: DEFAULT_SYSTEM_PROMPT,
      roundPrompt: '',
      round: 1,
      responses: [],
      selectedModels: ['gemini-3-flash-preview-high'], // Legacy selection
      activeModelsIds: [
        'gemini-3-flash-preview-high',
        'openrouter/qwen/qwen3-vl-30b-a3b-thinking',
        'openrouter/upstage/solar-pro-3:free'
      ],
      activeInstances: [], // New state for instances
      hasMigratedInstances: false,
      status: 'idle',
      columnStatus: {},
      summarizationEnabled: false,
      synthesisResult: null,
      fullTranscriptResult: null,
      selectedResponseIds: [],
      isJudging: false,
      
      isSynthesisModalOpen: false,
      pendingSynthesisModelId: null,
      judgeModelsIds: [],
      hasSeededJudgeModels: false,
      isSettingsOpen: false,
      isConfirmModalOpen: false,
      pendingSystemPrompt: '',
      pendingAction: null,

      // Prompts Initial State
      hasSeededPrompts: false,
      systemPrompts: [],
      activeInitialPromptId: 'default-initial',
      activeRoundPromptId: 'default-round',

      // Personas Initial State
      hasSeededPersonas: false,
      personas: [],
      activePersonasIds: [],
      modelPersonas: {},

      // Actions
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setPrompt: (prompt) => set({ prompt }),
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
        
        const newSelected = state.selectedModels.filter(id => id !== modelId || active.includes(modelId));
        return { activeModelsIds: active, selectedModels: newSelected };
      }),

      addModelInstance: (modelId) => set((state) => {
        const newInstanceId = `${modelId}_${Math.random().toString(36).substr(2, 9)}`;
        return { 
          activeInstances: [...state.activeInstances, { id: newInstanceId, modelId }],
          selectedModels: [...state.selectedModels, newInstanceId] // Auto-select when added
        };
      }),

      addAllModelInstances: (modelIds) => set((state) => {
        const newInstances: ModelInstance[] = [];
        const newSelected = [...state.selectedModels];
        
        modelIds.forEach(modelId => {
           // Skip if the user already has at least one instance of this model
           if (!state.activeInstances.some(inst => inst.modelId === modelId)) {
             const newInstanceId = `${modelId}_${Math.random().toString(36).substr(2, 9)}`;
             newInstances.push({ id: newInstanceId, modelId });
             newSelected.push(newInstanceId);
           }
        });

        return {
           activeInstances: [...state.activeInstances, ...newInstances],
           selectedModels: newSelected
        };
      }),

      removeModelInstance: (instanceId) => set((state) => {
        return {
          activeInstances: state.activeInstances.filter(inst => inst.id !== instanceId),
          selectedModels: state.selectedModels.filter(id => id !== instanceId)
        };
      }),

      setModelInstanceCount: (modelId, count) => set((state) => {
        const currentInstances = state.activeInstances.filter(inst => inst.modelId === modelId);
        const currentCount = currentInstances.length;
        
        if (count === currentCount) return {};
        
        if (count > currentCount) {
          // Add more instances
          const toAdd = count - currentCount;
          const newInstances = Array.from({ length: toAdd }, () => {
            const newId = `${modelId}_${Math.random().toString(36).substr(2, 9)}`;
            return { id: newId, modelId };
          });
          return {
            activeInstances: [...state.activeInstances, ...newInstances],
            selectedModels: [...state.selectedModels, ...newInstances.map(i => i.id)]
          };
        } else {
          // Remove excess instances (remove from the end)
          const toRemove = currentInstances.slice(count);
          const removeIds = new Set(toRemove.map(i => i.id));
          return {
            activeInstances: state.activeInstances.filter(inst => !removeIds.has(inst.id)),
            selectedModels: state.selectedModels.filter(id => !removeIds.has(id))
          };
        }
      }),

      clearAllInstances: () => set({
        activeInstances: [],
        selectedModels: [],
        activeModelsIds: []
      }),

      setInstancePersona: (instanceId, personaId) => set((state) => {
        return {
          activeInstances: state.activeInstances.map(inst => 
            inst.id === instanceId ? { ...inst, personaId } : inst
          )
        };
      }),

      toggleInstanceSelection: (instanceId) => set((state) => {
        const selected = state.selectedModels.includes(instanceId)
          ? state.selectedModels.filter(id => id !== instanceId)
          : [...state.selectedModels, instanceId];
        return { selectedModels: selected };
      }),

      toggleJudgeModel: (modelId) => set((state) => {
        const judges = state.judgeModelsIds.includes(modelId)
          ? state.judgeModelsIds.filter(id => id !== modelId)
          : [...state.judgeModelsIds, modelId];
        return { judgeModelsIds: judges };
      }),

      setSummarizationEnabled: (enabled) => set({ summarizationEnabled: enabled }),

      startDeliberation: (draftSystemPrompt?: string) => set((state) => {
        if (!state.prompt.trim() || state.selectedModels.length === 0) return state;
        return {
          isConfirmModalOpen: true,
          pendingAction: 'start',
          pendingSystemPrompt: draftSystemPrompt || state.systemPrompts.find(p => p.id === state.activeInitialPromptId)?.content || "",
        };
      }),

      startNextRound: (draftSystemPrompt?: string) => set((state) => {
        if (state.selectedModels.length === 0) return state;
        return {
          isConfirmModalOpen: true,
          pendingAction: 'next',
          pendingSystemPrompt: draftSystemPrompt || state.systemPrompts.find(p => p.id === state.activeRoundPromptId)?.content || "",
        };
      }),

      confirmDeliberation: () => set((state) => {
        const newColumnStatus: Record<string, ColumnStatus> = {};
        state.selectedModels.forEach(m => newColumnStatus[m] = 'loading');
        
        if (state.pendingAction === 'start') {
          return {
            isConfirmModalOpen: false,
            status: 'deliberating',
            round: 1,
            responses: [],
            columnStatus: newColumnStatus,
            synthesisResult: null,
            roundPrompt: '',
            activeSystemPrompt: state.pendingSystemPrompt,
            pendingAction: null
          };
        } else {
          return {
            isConfirmModalOpen: false,
            status: 'deliberating',
            round: state.round + 1,
            columnStatus: newColumnStatus,
            roundPrompt: '',
            activeSystemPrompt: state.pendingSystemPrompt,
            pendingAction: null
          };
        }
      }),

      cancelDeliberation: () => set({ 
        isConfirmModalOpen: false, 
        pendingAction: null 
      }),

      endDeliberation: (synthesisResult) => set({ 
        status: 'completed',
        synthesisResult,
        columnStatus: {}
      }),
      
      openSynthesisModal: (modelId: string) => set({
        isSynthesisModalOpen: true,
        pendingSynthesisModelId: modelId
      }),
      
      cancelSynthesisModal: () => set({
        isSynthesisModalOpen: false,
        pendingSynthesisModelId: null
      }),

      endWithFullTranscript: () => set((state) => {
        const selectedResponses = state.responses
          .filter(r => !r.error && state.selectedResponseIds.includes(r.id))
          .sort((a, b) => a.round - b.round || a.modelName.localeCompare(b.modelName));

        const transcript = selectedResponses
          .map(r => `## ${r.modelName}${r.personaName ? ` (${r.personaName})` : ''} — Rodada ${r.round}\n\n### Análise\n${r.analysis}\n\n### Conclusão Final\n${r.conclusion}`)
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
          .map(r => `## ${r.modelName}${r.personaName ? ` (${r.personaName})` : ''} — Rodada ${r.round}\n\n### Análise\n${r.analysis}\n\n### Conclusão Final\n${r.conclusion}`)
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
      }),

      // Prompts Implementation
      addSystemPrompt: (prompt) => set((state) => {
        const newPrompt = { ...prompt, id: `prompt-${Date.now()}` };
        return { systemPrompts: [...state.systemPrompts, newPrompt] };
      }),
      updateSystemPrompt: (id, data) => set((state) => ({
        systemPrompts: state.systemPrompts.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      deleteSystemPrompt: (id) => set((state) => {
        const newPrompts = state.systemPrompts.filter(p => p.id !== id);
        let newInitial = state.activeInitialPromptId;
        let newRound = state.activeRoundPromptId;
        if (newInitial === id) {
          newInitial = newPrompts.find(p => p.category === 'initial')?.id || '';
        }
        if (newRound === id) {
          newRound = newPrompts.find(p => p.category === 'round')?.id || '';
        }
        return { systemPrompts: newPrompts, activeInitialPromptId: newInitial, activeRoundPromptId: newRound };
      }),
      setActivePrompt: (id, category) => set(() => {
        if (category === 'initial') return { activeInitialPromptId: id };
        return { activeRoundPromptId: id };
      })
    }),
    {
      name: 'llm-deliberation-storage',
      partialize: (state) => ({ 
        prompt: state.prompt,
        roundPrompt: state.roundPrompt,
        round: state.round,
        responses: state.responses,
        selectedModels: state.selectedModels,
        activeModelsIds: state.activeModelsIds,
        activeInstances: state.activeInstances,
        hasMigratedInstances: state.hasMigratedInstances,
        judgeModelsIds: state.judgeModelsIds,
        hasSeededJudgeModels: state.hasSeededJudgeModels,
        summarizationEnabled: state.summarizationEnabled,
        synthesisResult: state.synthesisResult,
        fullTranscriptResult: state.fullTranscriptResult,
        selectedResponseIds: state.selectedResponseIds,
        hasSeededPersonas: state.hasSeededPersonas,
        personas: state.personas,
        activePersonasIds: state.activePersonasIds,
        modelPersonas: state.modelPersonas,
        hasSeededPrompts: state.hasSeededPrompts,
        systemPrompts: state.systemPrompts,
        activeInitialPromptId: state.activeInitialPromptId,
        activeRoundPromptId: state.activeRoundPromptId
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

          if (!state.hasSeededJudgeModels) {
             const allDynamicModels = Object.values(registryData).flat() as ModelInfo[];
             const combinedModels = [...ALL_MODELS, ...allDynamicModels];
             const uniqueModels = Array.from(new Map(combinedModels.map(item => [item.id, item])).values());
             
             const defaultJudges = uniqueModels.filter(isDefaultJudge).map(m => m.id);
             useDeliberationStore.setState({
               hasSeededJudgeModels: true,
               judgeModelsIds: [...new Set([...state.judgeModelsIds, ...defaultJudges])]
             });
          }

          if (!state.hasSeededPrompts || state.systemPrompts.length === 0) {
             const defaultInitial: SystemPrompt = {
               id: 'default-initial',
               name: 'Prompt Inicial Padrão',
               category: 'initial',
               content: DEFAULT_SYSTEM_PROMPT
             };
             const defaultRound: SystemPrompt = {
               id: 'default-round',
               name: 'Inclusão de Histórico e Consenso de Rodada',
               category: 'round',
               content: "Leia com atenção as soluções preliminares submetidas pelos outros especialistas do painel.\n\nInstrução de Debate:\n1. Mantendo a sua identidade e foco de especialista, avalie criticamente as respostas dos seus colegas. O que eles acertaram? O que eles ignoraram que a sua especialidade considera vital?\n2. Discuta abertamente os pontos de discordância.\n3. Utilize a opinião dos outros agentes como informação adicional valiosa para corrigir as suas próprias falhas.\n4. Sintetize as melhores ideias do grupo e forneça uma resposta atualizada e melhorada para resolver o problema inicial.\n\nEstruture a sua resposta usando EXATAMENTE duas marcações Markdown: '## Análise' e '## Conclusão Final'. Seja claro, estruturado e profissional."
             };
             
             const newPrompts = [...state.systemPrompts];
             if (!newPrompts.some(p => p.id === 'default-initial')) newPrompts.push(defaultInitial);
             if (!newPrompts.some(p => p.id === 'default-round')) newPrompts.push(defaultRound);

             const initialId = state.activeInitialPromptId && state.activeInitialPromptId !== '' ? state.activeInitialPromptId : 'default-initial';
             const roundId = state.activeRoundPromptId && state.activeRoundPromptId !== '' ? state.activeRoundPromptId : 'default-round';

             useDeliberationStore.setState({
                hasSeededPrompts: true,
                systemPrompts: newPrompts,
                activeInitialPromptId: initialId,
                activeRoundPromptId: roundId
             });
          }

          if (!state.hasMigratedInstances && (state.activeInstances === undefined || state.activeInstances.length === 0)) {
            // Migrate activeModelsIds to activeInstances (one-time only)
            if (state.activeModelsIds && state.activeModelsIds.length > 0) {
              const migratedInstances = state.activeModelsIds.map(modelId => ({
                id: `${modelId}_migrated_${Math.random().toString(36).substr(2, 9)}`,
                modelId,
                personaId: state.modelPersonas?.[modelId] || undefined
              }));
              
              // Also map selectedModels if they match the old modelId
              let newSelected = [...(state.selectedModels || [])];
              migratedInstances.forEach(inst => {
                if (newSelected.includes(inst.modelId)) {
                  newSelected = newSelected.filter(id => id !== inst.modelId);
                  newSelected.push(inst.id);
                }
              });

              useDeliberationStore.setState({ 
                activeInstances: migratedInstances,
                selectedModels: newSelected,
                hasMigratedInstances: true
              });
            } else {
              useDeliberationStore.setState({ activeInstances: [], hasMigratedInstances: true });
            }
          }
        }, 0);
      }
    }
  )
);
