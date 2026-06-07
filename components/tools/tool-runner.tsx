'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Copy, Check, FileText, ArrowLeft, RotateCcw, BrainCircuit, Square, Sparkles, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AITool } from '../../types/tools';
import { useSettingsStore } from '../../stores/settings-store';
import { useToastStore } from '../../stores/toast-store';
import { useNotesStore } from '../../stores/notes-store';
import { streamChatCompletions } from '../../lib/openrouter/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { cn } from '../../lib/utils/cn';
import { fadeUp, springTransition } from '../../lib/utils/animations';

interface ToolRunnerProps {
  tool: AITool;
  onBack: () => void;
}

export const ToolRunner: React.FC<ToolRunnerProps> = ({ tool, onBack }) => {
  const { settings } = useSettingsStore();
  const { showToast } = useToastStore();
  const { addNote } = useNotesStore();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState(tool.modelPreset || settings.defaultModel);
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await fetchModels(settings.apiKey);
        if (models && models.length > 0) {
          setAvailableModels(models.map(m => ({ id: m.id, name: m.name })));
        }
      } catch (e) {
        console.error('Failed to load models for tool:', e);
      }
    };
    loadModels();
  }, [settings.apiKey]);

  useEffect(() => {
    const defaults: Record<string, string> = {};
    tool.inputs.forEach((input) => { defaults[input.id] = input.defaultValue || ''; });
    setFormValues(defaults);
    setOutput('');
  }, [tool]);

  const handleInputChange = (id: string, value: string) => { setFormValues((prev) => ({ ...prev, [id]: value })); };

  const handleAbort = () => {
    if (controller) { controller.abort(); setController(null); setIsStreaming(false); showToast('Canceled', 'info', 'Generation stopped.'); }
  };

  const handleRunTool = async () => {
    for (const input of tool.inputs) {
      if (!formValues[input.id]?.trim()) { showToast('Required', 'error', `${input.label} is missing.`); return; }
    }
    if (!settings.apiKey) { showToast('API Key Required', 'error', 'Configure your API key in Settings.'); return; }

    setIsStreaming(true); setOutput('');
    let userPrompt = tool.userPromptTemplate;
    Object.entries(formValues).forEach(([key, val]) => { userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, 'g'), val); });
    const messages = [
      { id: 'sys', role: 'system' as const, content: tool.systemPrompt, timestamp: Date.now() },
      { id: 'usr', role: 'user' as const, content: userPrompt, timestamp: Date.now() },
    ];
    const abortCtrl = new AbortController(); setController(abortCtrl);
    let currentResponse = '';

    await streamChatCompletions({
      apiKey: settings.apiKey, model: selectedModel, messages, temperature: 0.6, signal: abortCtrl.signal,
      onChunk: (chunk) => { currentResponse += chunk; setOutput(currentResponse); },
      onError: (err) => { setOutput(`⚠️ **Error:** ${err}`); showToast('Error', 'error', err); setIsStreaming(false); setController(null); },
      onStart: () => {}
    });

    setIsStreaming(false); setController(null);
    if (currentResponse) showToast('Success', 'success', `${tool.name} completed.`);
  };

  const handleSaveAsNote = () => {
    const topic = formValues['topic'] || formValues['subject'] || formValues['content']?.slice(0, 20) || 'Tool output';
    const noteId = addNote({ title: `${tool.name}: ${topic.trim()}`, content: output, tags: ['study-tool', tool.id] });
    if (noteId) showToast('Saved', 'success', 'Added to study notes.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      
      {/* Header */}
      <div className="h-16 px-8 flex items-center justify-between flex-shrink-0 glass-morphism bg-white/5 border-none z-10">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="w-10 h-10 rounded-2xl glass-morphism flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-[15px] font-bold text-foreground">{tool.name}</h2>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">{tool.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Input Panel */}
        <div className="w-full md:w-[380px] flex flex-col glass-morphism bg-white/5 border-none m-4 mr-2 rounded-[32px] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center space-x-3 bg-white/5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <BrainCircuit className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-bold text-foreground tracking-tight">Task Parameters</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {tool.inputs.map((input) => (
              <div key={input.id} className="space-y-2">
                <label className="text-[11px] font-black text-primary uppercase tracking-[0.2em] ml-2">{input.label}</label>
                {input.type === 'textarea' ? (
                  <textarea
                    rows={6} value={formValues[input.id] || ''} onChange={(e) => handleInputChange(input.id, e.target.value)}
                    placeholder={input.placeholder} disabled={isStreaming}
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] p-5 text-sm font-medium outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/10 transition-all resize-none"
                  />
                ) : (
                  <input
                    value={formValues[input.id] || ''} onChange={(e) => handleInputChange(input.id, e.target.value)}
                    placeholder={input.placeholder} disabled={isStreaming}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/10 transition-all"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-white/5 space-y-4 bg-white/5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Intelligence Profile</label>
              <select 
                value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-2xl p-4 text-xs font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary/40 appearance-none transition-all text-foreground"
              >
                {availableModels.length > 0 ? (
                  availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))
                ) : (
                  <>
                    <option value={selectedModel}>{selectedModel || 'Loading Models...'}</option>
                  </>
                )}
              </select>
            </div>

            {isStreaming ? (
              <Button variant="destructive" onClick={handleAbort} className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-destructive/20 flex items-center justify-center space-x-2 transition-all">
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Generation</span>
              </Button>
            ) : (
              <Button onClick={handleRunTool} className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20 flex items-center justify-center space-x-2 transition-all hover:scale-105 active:scale-95">
                <Play className="h-4 w-4 fill-current" />
                <span>Execute Formula</span>
              </Button>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col glass-morphism bg-white/5 border-none m-4 ml-2 rounded-[32px] overflow-hidden relative">
          <AnimatePresence mode="wait">
            {output ? (
              <motion.div key="output-ready" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={springTransition} className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-8 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-white/5">
                  <div className="flex items-center space-x-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    <Sparkles className="h-4 w-4" />
                    <span>Intelligence Output</span>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); showToast('Copied', 'success', 'Output copied.'); }} className="flex items-center space-x-2 text-[11px] font-bold text-muted-foreground hover:text-primary transition-all uppercase tracking-widest">
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button onClick={handleSaveAsNote} className="flex items-center space-x-2 text-[11px] font-bold text-muted-foreground hover:text-primary transition-all uppercase tracking-widest border-l border-white/10 pl-3">
                      <FileText className="h-4 w-4" />
                      <span>Save as Note</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-10 py-10 prose prose-slate dark:prose-invert max-w-none selection:bg-primary/20 custom-scrollbar">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <motion.div key="output-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-3xl glass-morphism mb-6 flex items-center justify-center text-primary/30">
                  <Play className="h-8 w-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Awaiting Execution</h3>
                <p className="text-xs text-muted-foreground/60 max-w-xs mt-2">Configure the formula on the left and execute to see the AI intelligence results here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default ToolRunner;

