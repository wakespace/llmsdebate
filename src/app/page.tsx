"use client";

import { useEffect, useRef, useState } from "react";
import { useDeliberationStore } from "@/store/useDeliberationStore";
import { InputArea } from "@/components/InputArea";
import { ModelColumn } from "@/components/ModelColumn";
import { ActionControls } from "@/components/ActionControls";
import { BrainCircuit, Settings2 } from "lucide-react";
import { SettingsSidebar } from "@/components/SettingsSidebar";
import registryData from "@/data/models_registry.json";

// Helper to parse Analysis and Conclusion safely
function parseResponse(text: string) {
  let analysis = text.trim();
  let conclusion = "Conclusão não explicitada pelo modelo.";

  // Find the split point. Look for "Conclusão" variations with markdown formatting (headers, bold, etc.)
  const regex = /(?:\n|^)\s*(?:#+\s*)?(?:\*{1,2}|_{1,2})?(?:Conclusão Final|Conclusão|CONCLUSÃO|Conclusion)(?:\s+Final)?(?:\*{1,2}|_{1,2})?[:*\-\s\n]*([\s\S]*)/i;
  const match = text.match(regex);

  if (match) {
    conclusion = match[1].trim();
    // Everything before the match is analysis
    const splitIndex = match.index || 0;
    
    // Clean up analysis part
    let anaPart = text.substring(0, splitIndex).trim();
    // Remove "Análise" header if present at the very beginning of the string
    anaPart = anaPart.replace(/^(?:#+\s*)?Análise(?: Detalhada)?[:*\-\s\n]*/i, '').trim();
    
    if (anaPart.length > 0) analysis = anaPart;
  } else {
    // If we couldn't find a clean split, maybe there is only an "Análise" section
    if (text.match(/^(?:#+\s*)?Análise/i)) {
      analysis = text.replace(/^(?:#+\s*)?Análise(?: Detalhada)?[:*\-\s\n]*/i, '').trim();
    }
  }

  // Final fallback
  if (!analysis) {
    analysis = "Análise não retornada estruturadamente.";
  }

  return { analysis, conclusion };
}

export default function Home() {
  const { 
    status, round, prompt, selectedModels, responses, 
    columnStatus, summarizationEnabled, 
    setColumnStatus, addResponse, endDeliberation,
    isSettingsOpen, setSettingsOpen
  } = useDeliberationStore();

  const deliberatingRef = useRef(false);

  useEffect(() => {
    // Only trigger once per deliberating state transition
    if (status === 'deliberating' && !deliberatingRef.current) {
      deliberatingRef.current = true;
      executeRound();
    } else if (status !== 'deliberating') {
      deliberatingRef.current = false;
    }
  }, [status, round]);

  const executeRound = async () => {
    // Check if the user contributed text for this specific round 
    const currentSystemPrompt = useDeliberationStore.getState().activeSystemPrompt;
    
    // 1. Identify which models are participating in this round
    // In round 1, it's all selectedModels
    // In round 2+, it's only models that haven't errored in the previous round
    let activeModels = [...selectedModels];
    
    if (round > 1) {
      activeModels = [...selectedModels];
      
      if (activeModels.length === 0) {
        // No one survived or all were unselected, end deliberation
        useDeliberationStore.setState({ status: 'completed' });
        return;
      }
    }

    // 2. Prepare History Truncation / Summarization logic
    let historyPayload: any[] = [];
    
    // Get user-selected response IDs to filter context
    const selectedIds = useDeliberationStore.getState().selectedResponseIds;
    
    if (round > 1) {
      if (summarizationEnabled) {
        // Implement summarization using the first active model (or gemini ideally)
        const allTextHistory = responses
          .filter(r => r.round < round && !r.error && selectedIds.includes(r.id))
          .map(r => `[${r.modelName} - Rodada ${r.round}]:\n${r.text}`)
          .join('\n\n');
          
        if (allTextHistory.length === 0) {
          // No responses selected — skip summarization, proceed with no context
          historyPayload = [];
        } else {
          try {
            const summaryPrompt = `Resuma as principais perspetivas, pontos de convergência e divergência das rodadas anteriores de forma estruturada e objetiva: \n\n${allTextHistory}`;
            
            let sumModel = selectedModels.find(m => m.includes('gemini')) || activeModels[0];
            const isLocal = sumModel.startsWith('local/');
            
            const endpoint = isLocal ? '/api/local' : '/api/deliberate';
            let bodyPayload: any = { prompt: summaryPrompt, round: 1, model: sumModel };
            if (isLocal) {
              bodyPayload = {
                model: sumModel.replace('local/', ''),
                messages: [{ role: 'user', content: summaryPrompt }]
              };
            }

            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload)
            });
            
            if (res.ok) {
              const data = await res.json();
              const summaryText = isLocal ? data.choices?.[0]?.message?.content : data.text;
              historyPayload = [{ modelName: "Resumo do Sistema", round: 'Anterior', text: summaryText }];
            } else {
               historyPayload = responses.filter(r => !r.error && selectedIds.includes(r.id));
            }
          } catch (e) {
            historyPayload = responses.filter(r => !r.error && selectedIds.includes(r.id));
          }
        }
      } else {
        // Truncate logic (limit to ~48k chars roughly)
        // Sort descending by round, so we keep the newest always
        // Only include user-selected responses
        const validResp = [...responses]
          .filter(r => !r.error && selectedIds.includes(r.id))
          .sort((a,b) => b.round - a.round);
        let totalLen = 0;
        const kept = [];
        for (const r of validResp) {
          if (totalLen + r.text.length < 45000) {
            kept.push(r);
            totalLen += r.text.length;
          } else {
            break;
          }
        }
        historyPayload = kept.reverse(); // put back in chronological order
      }
    }


    // 3. Dispatch fetches in parallel
    const promises = activeModels.map(async (modelId) => {
      setColumnStatus(modelId, 'loading');
      const startTime = Date.now();
      
      const isLocal = modelId.startsWith('local/');
      const endpoint = isLocal ? '/api/local' : '/api/deliberate';
      
      // Map name
      const registryArray = [
        ...registryData.openai,
        ...registryData.gemini,
        ...registryData.perplexity,
        ...registryData.openrouter,
        ...registryData.local
      ];
      const knownModel = registryArray.find(m => m.id === modelId);
      let modelName = knownModel ? knownModel.name : modelId;
      if (isLocal) modelName = `${modelId.replace('local/', '')} (Local)`;

      let resultText = "";
      let hasError = false;
      let errorMsg = undefined;

      try {
        let bodyPayload: any;
        
        if (isLocal) { // Map to OpenAI API standard to be proxied
           let messages = [{ role: 'system', content: currentSystemPrompt }];
           if (round === 1) {
             messages.push({ role: 'user', content: prompt });
           } else {
             // Truncate history for local models (limited context window ~4k tokens)
             let hText = historyPayload.map((r: any) => `[${r.modelName} - Rodada ${r.round}]:\n${r.text}`).join('\n\n');
             if (hText.length > 3000) {
               hText = hText.slice(-3000);
               hText = '...(histórico truncado)\n\n' + hText;
             }
             let userPromptText = `Problema original: ${prompt}\n\nResumo das perspetivas anteriores:\n${hText}\n\nReflita sobre as perspetivas acima. Estruture sua resposta em 'Análise' e 'Conclusão Final'.`;
             
             messages.push({ role: 'user', content: userPromptText });
           }
           
           bodyPayload = {
              model: modelId.replace('local/', ''),
              messages
           };
        } else {
           bodyPayload = {
             prompt,
             round,
             model: modelId,
             previousResponses: historyPayload,
             systemPrompt: currentSystemPrompt
           };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });

        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.error || `HTTP ${res.status}`);
        }
        
        resultText = isLocal ? data.choices?.[0]?.message?.content : data.text;
        
      } catch (err: any) {
        hasError = true;
        errorMsg = err.message || "Falha na requisição";
      }

      const durationMs = Date.now() - startTime;
      
      if (hasError) {
         setColumnStatus(modelId, 'error');
         addResponse({
           id: `${round}-${modelId}-${Date.now()}`,
           round,
           modelId,
           modelName,
           text: "",
           analysis: "",
           conclusion: "",
           error: errorMsg,
           durationMs
         });
      } else {
         const { analysis, conclusion } = parseResponse(resultText);
         setColumnStatus(modelId, 'success');
         addResponse({
           id: `${round}-${modelId}-${Date.now()}`,
           round,
           modelId,
           modelName,
           text: resultText,
           analysis,
           conclusion,
           durationMs
         });
      }
    });

    // Wait for all requests to finish
    await Promise.all(promises);
    
    // Everything done, revert status to idle
    useDeliberationStore.setState({ status: 'idle' });
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 w-full relative">
      <main className="flex flex-col flex-1 p-4 md:p-6 lg:p-8 max-w-[1700px] mx-auto w-full gap-6">
        
        {/* Global Modals / Sidebars */}
        <SettingsSidebar isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />

        {/* Main Input Area */}
        <InputArea />

        {/* Main Deliberation Grid Area — grows naturally with content */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 flex flex-col relative animate-fade-in shadow-inner z-10" style={{ animationDelay: '0.1s' }}>
          
          {selectedModels.length === 0 && responses.length === 0 && (
            <div className="flex items-center justify-center text-white/20 flex-col gap-4 py-20">
              <BrainCircuit className="w-24 h-24 opacity-20" />
              <p className="text-lg font-medium tracking-wide">Selecione especialistas e inicie o debate.</p>
            </div>
          )}
          
          <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-2 snap-x relative w-full items-start">
             {/* Show columns for all models that participated OR are currently selected */}
             {Array.from(new Set([
               ...selectedModels,
               ...responses.filter(r => r.modelId !== 'user').map(r => r.modelId)
             ])).map(modelId => (
               <ModelColumn key={modelId} modelId={modelId} />
             ))}
          </div>
        </div>

        {/* Bottom Controls */}
        <ActionControls />

      </main>
    </div>
  );
}
