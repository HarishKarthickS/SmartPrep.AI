'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Key, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { useToastStore } from '../../stores/toast-store';
import { fetchModels } from '../../lib/openrouter/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [apiKey, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTested, setIsTested] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedDefaultModel, setSelectedDefaultModel] = useState('google/gemini-flash-1.5');
  
  const { setApiKey, updateSettings } = useSettingsStore();
  const { showToast } = useToastStore();

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      showToast('Key required', 'error', 'Please enter your OpenRouter API key first.');
      return;
    }

    setIsTesting(true);
    setIsTested(false);
    try {
      const models = await fetchModels(apiKey);
      if (models && models.length > 0) {
        setIsTested(true);
        // Save some highly visible model IDs for UI confirmation
        const modelIds = models.slice(0, 5).map(m => m.id);
        setAvailableModels(modelIds);
        showToast('Connection Successful!', 'success', 'Successfully authenticated with OpenRouter.');
      } else {
        throw new Error('No models returned. Verify key limits.');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Test Failed', 'error', err?.message || 'Invalid API Key or Network failure.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndStart = () => {
    if (!apiKey.trim()) {
      showToast('Key required', 'error', 'Please enter a key.');
      return;
    }
    
    // Save details to the Zustand persistent settings
    setApiKey(apiKey);
    updateSettings({
      defaultModel: selectedDefaultModel,
    });
    
    showToast('Workspace Ready', 'success', 'Welcome to SmartPrep AI Studio!');
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background soft blurs for a premium studio aesthetic */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg glass-panel p-8 rounded-lg shadow-2xl relative z-10 flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-md mb-2 flex items-center justify-center border border-primary/20 w-fit">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            SmartPrep AI Studio
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            An intelligent, highly functional workspace for learning, coding, writing, and research.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 gap-3.5 bg-muted/40 p-4 rounded-md border border-border">
          <div className="flex space-x-3 items-start text-sm">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Bring Your Own Key</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your OpenRouter API Key remains safely stored in local browser storage. No server side databases, zero tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <Input
              label="OpenRouter API Key"
              placeholder="sk-or-v1-..."
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setIsTested(false);
              }}
              icon={<Key className="h-4 w-4 text-muted-foreground" />}
              className="pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-[2.1rem] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleTestKey}
              isLoading={isTesting}
              className="flex-1 font-semibold"
            >
              Test Connection
            </Button>
            {isTested && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center px-4 rounded-md text-sm font-semibold space-x-1.5 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="h-4 w-4" />
                <span>Active</span>
              </div>
            )}
          </div>

          {/* Model presets selections after success */}
          {isTested && (
            <div className="flex flex-col space-y-2 mt-2 p-4 bg-muted/30 border border-border rounded-md animate-in fade-in slide-in-from-top-4 duration-200">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Default Intelligence Preset
              </label>
              <div className="grid grid-cols-1 gap-2 mt-1">
                <button
                  onClick={() => setSelectedDefaultModel('google/gemini-flash-1.5')}
                  className={`p-2.5 text-left text-xs rounded-md border flex items-center justify-between cursor-pointer transition-all ${
                    selectedDefaultModel === 'google/gemini-flash-1.5'
                      ? 'bg-primary/5 border-primary text-foreground font-medium'
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div>
                    <p className="font-semibold">Gemini 1.5 Flash</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Huge context size, fast, ideal for documents</p>
                  </div>
                  {selectedDefaultModel === 'google/gemini-flash-1.5' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>

                <button
                  onClick={() => setSelectedDefaultModel('openai/gpt-4o-mini')}
                  className={`p-2.5 text-left text-xs rounded-md border flex items-center justify-between cursor-pointer transition-all ${
                    selectedDefaultModel === 'openai/gpt-4o-mini'
                      ? 'bg-primary/5 border-primary text-foreground font-medium'
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div>
                    <p className="font-semibold">GPT-4o Mini</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Extremely fast, cheap, perfect for rapid QA</p>
                  </div>
                  {selectedDefaultModel === 'openai/gpt-4o-mini' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>

                <button
                  onClick={() => setSelectedDefaultModel('anthropic/claude-3.5-sonnet')}
                  className={`p-2.5 text-left text-xs rounded-md border flex items-center justify-between cursor-pointer transition-all ${
                    selectedDefaultModel === 'anthropic/claude-3.5-sonnet'
                      ? 'bg-primary/5 border-primary text-foreground font-medium'
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div>
                    <p className="font-semibold">Claude 3.5 Sonnet</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Premier writing, logic, coding and explanations</p>
                  </div>
                  {selectedDefaultModel === 'anthropic/claude-3.5-sonnet' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <Button
          onClick={handleSaveAndStart}
          disabled={!apiKey.trim()}
          className="w-full h-11 font-semibold group flex items-center justify-center space-x-2"
        >
          <span>Save API Key & Initialize Studio</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>

        {/* Disclaimer Footer */}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Your key never leaves your browser. You can retrieve, remove, or customize models at any time under the Settings panel.
        </p>
      </div>
    </div>
  );
};
