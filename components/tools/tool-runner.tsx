'use client';

import React, { useState, useEffect } from 'react';
import { Play, Copy, Check, FileText, ArrowLeft, RotateCcw, BrainCircuit, Square } from 'lucide-react';
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);

  // Initialize form default values
  useEffect(() => {
    const defaults: Record<string, string> = {};
    tool.inputs.forEach((input) => {
      defaults[input.id] = input.defaultValue || '';
    });
    setFormValues(defaults);
    setOutput('');
  }, [tool]);

  const handleInputChange = (id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleAbort = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setIsStreaming(false);
      showToast('Canceled', 'info', 'AI generation halted.');
    }
  };

  const handleRunTool = async () => {
    // Validate inputs
    for (const input of tool.inputs) {
      if (!formValues[input.id]?.trim()) {
        showToast('Input required', 'error', `Please fill out the "${input.label}" field.`);
        return;
      }
    }

    if (!settings.apiKey) {
      showToast('API Key Required', 'error', 'Set your OpenRouter Key in Settings first.');
      return;
    }

    setIsStreaming(true);
    setOutput('');

    // Compile Prompt
    let userPrompt = tool.userPromptTemplate;
    Object.entries(formValues).forEach(([key, val]) => {
      userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });

    const messages = [
      { id: 'sys', role: 'system' as const, content: tool.systemPrompt, timestamp: Date.now() },
      { id: 'usr', role: 'user' as const, content: userPrompt, timestamp: Date.now() },
    ];

    const abortCtrl = new AbortController();
    setController(abortCtrl);

    let currentResponse = '';

    await streamChatCompletions({
      apiKey: settings.apiKey,
      model: selectedModel,
      messages,
      temperature: 0.6,
      signal: abortCtrl.signal,
      onChunk: (chunk) => {
        currentResponse += chunk;
        setOutput(currentResponse);
      },
      onError: (err) => {
        setOutput(`⚠️ **OpenRouter API Error:**\n\n> ${err}\n\n*Verify your setup in Settings.*`);
        showToast('Execution Error', 'error', err);
        setIsStreaming(false);
        setController(null);
      },
      onStart: () => {
        // Stream initialized
      }
    });

    setIsStreaming(false);
    setController(null);
    if (currentResponse) {
      showToast('Generation Finished', 'success', `${tool.name} ran successfully!`);
    }
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied', 'success', 'Markdown output copied to clipboard.');
  };

  const handleSaveAsNote = () => {
    const topic = formValues['topic'] || formValues['subject'] || formValues['content']?.slice(0, 20) || 'Tool output';
    const noteId = addNote({
      title: `${tool.name}: ${topic.trim()}`,
      content: output,
      tags: ['study-tool', tool.id],
    });

    if (noteId) {
      showToast('Saved to Notes', 'success', 'Saved permanently to your study collection.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-xs">
      
      {/* Top Header */}
      <div className="h-14 border-b border-border px-6 flex items-center justify-between flex-shrink-0 bg-card select-none">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{tool.name}</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Two panels workspace content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Form Inputs */}
        <div className="w-full md:w-[360px] border-b md:border-b-0 md:border-r border-border p-5 flex flex-col space-y-5 overflow-y-auto select-none">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-foreground font-semibold">
              <BrainCircuit className="h-4 w-4 text-primary" />
              <span>Input Parameters</span>
            </div>

            {tool.inputs.map((input) => (
              <div key={input.id} className="space-y-1">
                {input.type === 'textarea' ? (
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {input.label}
                    </label>
                    <textarea
                      rows={5}
                      value={formValues[input.id] || ''}
                      onChange={(e) => handleInputChange(input.id, e.target.value)}
                      placeholder={input.placeholder}
                      disabled={isStreaming}
                      className="w-full bg-card border border-border rounded p-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 resize-y leading-relaxed font-sans"
                    />
                  </div>
                ) : input.type === 'select' ? (
                  <Select
                    label={input.label}
                    value={formValues[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    options={input.options || []}
                    disabled={isStreaming}
                  />
                ) : (
                  <Input
                    label={input.label}
                    placeholder={input.placeholder}
                    value={formValues[input.id] || ''}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    disabled={isStreaming}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-3 border-t border-border mt-auto">
            <Select
              label="Selected Intelligence Model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              options={[{ label: 'Gemini 1.5 Flash', value: 'google/gemini-flash-1.5' }, { label: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' }, { label: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' }]}
              disabled={isStreaming}
            />

            {isStreaming ? (
              <Button
                variant="destructive"
                onClick={handleAbort}
                className="w-full font-semibold flex items-center justify-center space-x-2"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Generation</span>
              </Button>
            ) : (
              <Button
                onClick={handleRunTool}
                className="w-full font-semibold flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Run Studio Tool</span>
              </Button>
            )}
          </div>
        </div>

        {/* Right Side: Streaming Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background relative select-text">
          {output ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Output Actions Tool bar */}
              <div className="h-10 border-b border-border bg-card/60 px-5 flex items-center justify-end space-x-3 flex-shrink-0 select-none">
                <button
                  onClick={handleCopyOutput}
                  className="flex items-center space-x-1.5 text-[11px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Output'}</span>
                </button>

                <button
                  onClick={handleSaveAsNote}
                  className="flex items-center space-x-1.5 text-[11px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Save as Note</span>
                </button>
              </div>

              {/* Render output stream content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 prose prose-slate dark:prose-invert max-w-none text-sm text-foreground/90 font-normal leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {output}
                </ReactMarkdown>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
              <Play className="h-10 w-10 text-muted-foreground/30 mb-3 animate-pulse-slow" />
              <h3 className="text-sm font-semibold text-foreground">Awaiting Studio Run</h3>
              <p className="text-[11px] text-muted-foreground max-w-xs mt-1 leading-normal">
                Fill in the parameters on the left and click "Run Studio Tool" to stream your customized study outputs.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default ToolRunner;
