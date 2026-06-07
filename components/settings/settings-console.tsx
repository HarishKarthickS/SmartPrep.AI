'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  ShieldCheck,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Database,
  Type
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { useChatStore } from '../../stores/chat-store';
import { useNotesStore } from '../../stores/notes-store';
import { useToastStore } from '../../stores/toast-store';
import { fetchModels } from '../../lib/openrouter/client';
import { Button } from '../ui/button';
import { ModelSelector } from '../ui/model-selector';
import { Dialog } from '../ui/dialog';
import { cn } from '../../lib/utils/cn';
import { fadeUp, staggerContainer, springTransition } from '../../lib/utils/animations';

export const SettingsConsole: React.FC = () => {
  const { settings, updateSettings, setApiKey, resetSettings } = useSettingsStore();
  const { sessions, clearAllSessions } = useChatStore();
  const { notes, library, clearAllNotesAndLibrary } = useNotesStore();
  const { showToast } = useToastStore();

  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTested, setIsTested] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      showToast('Key Required', 'error', 'Enter your API key first.');
      return;
    }
    setIsTesting(true);
    setIsTested(false);
    try {
      const models = await fetchModels(apiKeyInput);
      if (models && models.length > 0) {
        setIsTested(true);
        showToast('Success', 'success', 'Connection validated.');
      } else throw new Error('No models returned.');
    } catch (e: any) {
      showToast('Failed', 'error', 'Invalid API Key.');
    } finally { setIsTesting(false); }
  };

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
    showToast('Saved', 'success', 'Credentials updated.');
  };

  const handleRemoveKey = () => {
    setApiKey(''); setApiKeyInput(''); setIsTested(false);
    showToast('Removed', 'info', 'API key deleted.');
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    showToast('Theme Updated', 'success', `Switched to ${theme}.`);
  };

  const handleExportBackup = () => {
    const backupData = { version: 1, timestamp: Date.now(), settings, sessions, notes, library };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartprep-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup Exported', 'success', 'Local data compiled.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const backup = JSON.parse(raw);
        if (!backup.version || !backup.settings) throw new Error('Invalid schema.');
        if (backup.settings) { useSettingsStore.setState({ settings: backup.settings }); setApiKeyInput(backup.settings.apiKey); }
        if (backup.sessions) useChatStore.setState({ sessions: backup.sessions, activeSessionId: backup.sessions[0]?.id || null });
        if (backup.notes) useNotesStore.setState({ notes: backup.notes });
        if (backup.library) useNotesStore.setState({ library: backup.library });
        showToast('Restored', 'success', 'Workspace migrated.');
      } catch (err) { showToast('Failed', 'error', 'Invalid backup file.'); }
    };
    reader.readAsText(file);
  };

  const handleWipeAllData = () => {
    resetSettings(); clearAllSessions(); clearAllNotesAndLibrary();
    setApiKeyInput(''); setIsTested(false); setShowClearConfirm(false);
    showToast('Wipe Complete', 'info', 'Workspace erased.');
    setTimeout(() => { window.location.reload(); }, 500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      
      {/* Header */}
      <div className="h-16 px-8 flex items-center justify-between flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border/40 z-10">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-primary">
            <Sliders className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-foreground">Settings Console</h2>
            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5">Workspace configuration & parameters</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <motion.div 
          variants={staggerContainer} initial="initial" animate="animate"
          className="max-w-3xl mx-auto space-y-6"
        >
          {/* API Key Panel */}
          <motion.div variants={fadeUp} className="bg-card border border-border/60 rounded-[24px] p-8 space-y-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
                <Key className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">OpenRouter Credentials</h3>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1 block mb-1.5">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-or-v1-..."
                    value={apiKeyInput}
                    onChange={(e) => { setApiKeyInput(e.target.value); setIsTested(false); }}
                    className="w-full bg-background border border-border/60 rounded-xl p-3 text-[13px] font-medium outline-none focus:ring-1 focus:ring-primary/40 focus:bg-secondary/20 transition-all pr-12"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" onClick={handleTestConnection} isLoading={isTesting} className="h-9 px-5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all">
                  Test Connection
                </Button>
                <Button onClick={handleSaveApiKey} disabled={apiKeyInput === settings.apiKey} className="h-9 px-5 rounded-lg font-bold uppercase tracking-widest text-[10px] shadow-none">
                  Save Key
                </Button>
                {settings.apiKey && (
                  <Button variant="ghost" onClick={handleRemoveKey} className="h-9 px-5 rounded-lg font-bold uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/10 transition-all">
                    Remove
                  </Button>
                )}
                <AnimatePresence>
                  {isTested && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest space-x-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Verified</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Preferences Panel */}
          <motion.div variants={fadeUp} className="bg-card border border-border/60 rounded-[24px] p-8 space-y-8 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Workspace Preferences</h3>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1 block">Theme Profile</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: 'Dark Mode', icon: <Moon className="h-4 w-4 text-indigo-400" /> },
                  { id: 'light', label: 'Light Mode', icon: <Sun className="h-4 w-4 text-amber-500" /> },
                  { id: 'system', label: 'System', icon: <Monitor className="h-4 w-4 text-sky-400" /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleThemeChange(item.id as any)}
                    className={cn(
                      "flex items-center justify-center space-x-2.5 p-3 rounded-xl border transition-all duration-300",
                      settings.theme === item.id 
                        ? "bg-secondary border-primary/30 text-foreground font-bold" 
                        : "border-border/40 bg-background text-muted-foreground hover:bg-secondary/40"
                    )}
                  >
                    {item.icon}
                    <span className="text-[10px] uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1 block">Font Size</label>
                <select 
                  value={settings.fontSize} 
                  onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
                  className="w-full bg-background border border-border/60 rounded-xl p-3 text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary/40 appearance-none transition-all text-foreground"
                >
                  <option value="sm">Compact</option>
                  <option value="base">Standard</option>
                  <option value="lg">Large</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1 block">Auto-Title</label>
                <select 
                  value={settings.autoTitle ? 'true' : 'false'} 
                  onChange={(e) => updateSettings({ autoTitle: e.target.value === 'true' })}
                  className="w-full bg-background border border-border/60 rounded-xl p-3 text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary/40 appearance-none transition-all text-foreground"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/40">
              <label className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1 block">Default Intelligence Brain</label>
              <div className="bg-background border border-border/60 rounded-2xl p-5">
                <ModelSelector 
                  selectedModelId={settings.defaultModel} 
                  onSelect={(modelId) => updateSettings({ defaultModel: modelId })} 
                  apiKey={settings.apiKey}
                  maxHeight="320px"
                />
              </div>
            </div>
          </motion.div>

          {/* Backup Panel */}
          <motion.div variants={fadeUp} className="bg-card border border-border/60 rounded-[24px] p-8 space-y-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Data Migration</h3>
            </div>

            <p className="text-[12px] text-muted-foreground/80 leading-relaxed font-medium">
              Manage your local knowledge base. You can export everything to a JSON file or restore a previous backup.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" onClick={handleExportBackup} className="h-9 px-5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all">
                <Download className="h-3.5 w-3.5 mr-2" />
                Export JSON
              </Button>

              <div className="relative">
                <input type="file" accept=".json" onChange={handleImportBackup} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <Button variant="outline" className="h-9 px-5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all">
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Import JSON
                </Button>
              </div>

              <Button 
                variant="ghost" onClick={() => setShowClearConfirm(true)} 
                className="h-9 px-5 rounded-lg font-bold uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/10 transition-all ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Wipe Data
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <Dialog
        isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)}
        title="Destroy All Local Data?"
        footer={
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={() => setShowClearConfirm(false)} className="rounded-xl font-bold uppercase tracking-wider text-[10px]">Cancel</Button>
            <Button variant="destructive" onClick={handleWipeAllData} className="rounded-xl font-bold uppercase tracking-wider text-[10px]">Confirm Destruction</Button>
          </div>
        }
      >
        <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
          This will permanently delete all chat history, study notes, library resources, and settings. This cannot be undone.
        </p>
      </Dialog>
    </div>
  );
};

export default SettingsConsole;

