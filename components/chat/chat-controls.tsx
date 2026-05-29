'use client';

import React, { useEffect, useState } from 'react';
import { Sliders, HelpCircle, BrainCircuit, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useToastStore } from '../../stores/toast-store';
import { fetchModels, defaultModelPresets } from '../../lib/openrouter/client';
import { OpenRouterModel } from '../../types/models';
import { Select } from '../ui/select';
import { Button } from '../ui/button';

interface ChatControlsProps {
  onSuggestedAction: (actionType: 'summarize' | 'quiz' | 'flashcards' | 'study-plan') => void;
}

export const ChatControls: React.FC<ChatControlsProps> = ({ onSuggestedAction }) => {
  const { sessions, activeSessionId, updateMessage } = useChatStore();
  const { settings, updateSettings, addCustomModel } = useSettingsStore();
  const { showToast } = useToastStore();

  const [models, setModels] = useState<OpenRouterModel[]>(defaultModelPresets);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Sync models list on launch
  useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const list = await fetchModels(settings.apiKey);
        if (list && list.length > 0) {
          setModels(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingModels(false);
      }
    };
    if (settings.apiKey) {
      loadModels();
    }
  }, [settings.apiKey]);

  const handleModelChange = (modelId: string) => {
    if (!activeSessionId) return;
    // Update active chat model
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId ? { ...s, model: modelId } : s
      ),
    }));
    showToast('Model Updated', 'info', `Workspace configured to use ${modelId}.`);
  };

  const handleTempChange = (temp: number) => {
    if (!activeSessionId) return;
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId ? { ...s, temperature: temp } : s
      ),
    }));
  };

  const handleSystemPromptChange = (prompt: string) => {
    if (!activeSessionId) return;
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId ? { ...s, systemPrompt: prompt } : s
      ),
    }));
  };

  const handleAddCustomModel = () => {
    if (!customModelInput.trim()) return;
    const cleanId = customModelInput.trim();
    addCustomModel(cleanId);
    setModels((prev) => [
      { id: cleanId, name: `Custom: ${cleanId}`, contextLength: 32000 },
      ...prev,
    ]);
    setCustomModelInput('');
    showToast('Model Added', 'success', `Custom model ${cleanId} is now selectable.`);
  };

  // Compile all models list (presets + loaded + custom)
  const allModelsOptions = [
    ...models.map((m) => ({ label: m.name, value: m.id })),
    ...settings.customModels.map((m) => ({ label: `Custom: ${m}`, value: m })),
  ];

  // Remove duplicates by value
  const uniqueModelsOptions = allModelsOptions.filter(
    (opt, index, self) => self.findIndex((o) => o.value === opt.value) === index
  );

  const messageCount = activeSession?.messages?.length || 0;
  const wordCount = activeSession?.messages?.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0) || 0;

  return (
    <div className="w-full h-full flex flex-col bg-card border-l border-border select-none text-xs">
      
      {/* Scrollable controls panel */}
      <div className="flex-1 overflow-y-auto p-4.5 space-y-6">
        
        {/* Section 1: Session Model config */}
        <div className="space-y-4 border-b border-border pb-5">
          <div className="flex items-center space-x-2 text-foreground font-semibold">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span>Model Intelligence</span>
          </div>

          <Select
            label="Active Model"
            value={activeSession?.model || settings.defaultModel}
            onChange={(e) => handleModelChange(e.target.value)}
            options={uniqueModelsOptions}
          />

          {isLoadingModels && (
            <p className="text-[10px] text-muted-foreground animate-pulse-slow">
              Fetching available live OpenRouter models...
            </p>
          )}

          {/* Custom Model Insertion */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Add Custom Model ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="meta-llama/llama-3-8b"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                className="flex-1 h-8 px-2 bg-muted/40 border border-border rounded text-[11px] outline-none focus:border-primary placeholder:text-muted-foreground"
              />
              <Button onClick={handleAddCustomModel} className="h-8 px-3 text-[11px] font-semibold">
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Section 2: Generation controls */}
        <div className="space-y-4 border-b border-border pb-5">
          <div className="flex items-center space-x-2 text-foreground font-semibold">
            <Sliders className="h-4 w-4 text-primary" />
            <span>Creativity Parameters</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-muted-foreground">Temperature</span>
              <span className="text-foreground">{activeSession?.temperature ?? settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.1"
              value={activeSession?.temperature ?? settings.temperature}
              onChange={(e) => handleTempChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-muted border border-border rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <p className="text-[10px] text-muted-foreground leading-normal mt-1.5">
              Lower temperatures focus outputs. Higher values enhance creative generation.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Custom System Prompt Instruction
            </label>
            <textarea
              value={activeSession?.systemPrompt || ''}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
              placeholder="You are an expert Socratic tutor, prompt step-by-step guidance..."
              className="w-full bg-muted/40 border border-border rounded p-2 text-xs outline-none focus:border-primary min-h-[90px] text-foreground resize-none leading-relaxed placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Section 3: Context Indicator */}
        <div className="space-y-4 border-b border-border pb-5">
          <div className="flex items-center space-x-2 text-foreground font-semibold">
            <Layers className="h-4 w-4 text-primary" />
            <span>Context Memory Weight</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-muted/40 p-2.5 rounded border border-border">
              <p className="font-bold text-foreground">{messageCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Messages</p>
            </div>
            <div className="bg-muted/40 p-2.5 rounded border border-border">
              <p className="font-bold text-foreground">{wordCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Words Count</p>
            </div>
          </div>
        </div>

        {/* Section 4: Suggested Smart Actions */}
        <div className="space-y-3">
          <p className="font-semibold text-foreground">Suggested AI Actions</p>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => onSuggestedAction('summarize')}
              disabled={messageCount === 0}
              className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded hover:bg-primary/5 hover:border-primary/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-left transition-all"
            >
              <div>
                <p className="font-semibold text-foreground">Summarize Chat</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Condense discussion history into notes</p>
              </div>
            </button>

            <button
              onClick={() => onSuggestedAction('quiz')}
              disabled={messageCount === 0}
              className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded hover:bg-primary/5 hover:border-primary/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-left transition-all"
            >
              <div>
                <p className="font-semibold text-foreground">Generate Exam Quiz</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Create MCQ questions based on this chat</p>
              </div>
            </button>

            <button
              onClick={() => onSuggestedAction('flashcards')}
              disabled={messageCount === 0}
              className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded hover:bg-primary/5 hover:border-primary/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-left transition-all"
            >
              <div>
                <p className="font-semibold text-foreground">Create Flashcards</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Formulate active-recall cards</p>
              </div>
            </button>

            <button
              onClick={() => onSuggestedAction('study-plan')}
              disabled={messageCount === 0}
              className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded hover:bg-primary/5 hover:border-primary/40 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-left transition-all"
            >
              <div>
                <p className="font-semibold text-foreground">Generate Study Plan</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Plan study schedules around active concepts</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
