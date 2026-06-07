'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ShieldCheck, Key, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { useToastStore } from '../../stores/toast-store';
import { fetchModels } from '../../lib/openrouter/client';
import { ModelSelector } from '../ui/model-selector';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/cn';
import { fadeUp, springTransition } from '../../lib/utils/animations';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [apiKey, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTested, setIsTested] = useState(false);
  const [selectedDefaultModel, setSelectedDefaultModel] = useState('');
  
  const { setApiKey, updateSettings } = useSettingsStore();
  const { showToast } = useToastStore();

  const handleTestKey = async () => {
    if (!apiKey.trim()) { showToast('Key Required', 'error', 'Enter your API key first.'); return; }
    setIsTesting(true); setIsTested(false);
    try {
      const fetchedModels = await fetchModels(apiKey);
      if (fetchedModels && fetchedModels.length > 0) {
        setIsTested(true);
        showToast('Connected!', 'success', 'OpenRouter authenticated.');
      } else throw new Error('No models found.');
    } catch (err: any) {
      showToast('Auth Failed', 'error', 'Invalid Key or Connection error.');
    } finally { setIsTesting(false); }
  };

  const handleSaveAndStart = () => {
    if (!apiKey.trim()) return;
    setApiKey(apiKey);
    updateSettings({ defaultModel: selectedDefaultModel });
    showToast('Ready', 'success', 'Welcome to the Studio.');
    onComplete();
  };

  return (
    <div className="min-h-screen w-screen bg-background flex items-center justify-center p-4 relative overflow-hidden select-none">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="w-full max-w-sm bg-card border border-border/60 p-8 rounded-[32px] shadow-sm relative z-10 flex flex-col space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <motion.div 
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-1"
          >
            <Zap className="h-6 w-6 fill-current" />
          </motion.div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">SmartPrep Studio</h1>
          <p className="text-[13px] text-muted-foreground/70 max-w-[280px] mx-auto leading-relaxed font-medium">
            Initialize your private learning workspace.
          </p>
        </div>

        <div className="space-y-4">
          {!isTested ? (
            <motion.div key="step-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="relative group">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="OpenRouter API Key"
                  value={apiKey}
                  onChange={(e) => { setApiKeyInput(e.target.value); }}
                  className="w-full bg-background border border-border/60 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all pr-12"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button 
                variant="primary" 
                onClick={handleTestKey} 
                isLoading={isTesting} 
                className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                Authenticate
              </Button>
            </motion.div>
          ) : (
            <motion.div key="step-2" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">Default Brain</label>
                <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <ModelSelector 
                selectedModelId={selectedDefaultModel} 
                onSelect={setSelectedDefaultModel} 
                apiKey={apiKey}
                maxHeight="240px"
              />

              <Button
                onClick={handleSaveAndStart}
                disabled={!selectedDefaultModel}
                className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center space-x-2 shadow-none"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </div>

        <div className="flex items-center justify-center space-x-3 text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] pt-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Private</span>
          <span>•</span>
          <span>Local Storage</span>
        </div>
      </motion.div>
    </div>
  );
};

