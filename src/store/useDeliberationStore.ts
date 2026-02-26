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

interface State {
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
        selectedResponseIds: state.selectedResponseIds
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (state.status === 'deliberating' || state.status === 'loading')) {
          useDeliberationStore.setState({ status: 'idle', columnStatus: {} });
        }
      }
    }
  )
);
