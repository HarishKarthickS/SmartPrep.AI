'use client';

import React, { useState } from 'react';
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
  Monitor
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { useChatStore } from '../../stores/chat-store';
import { useNotesStore } from '../../stores/notes-store';
import { useToastStore } from '../../stores/toast-store';
import { fetchModels } from '../../lib/openrouter/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Dialog } from '../ui/dialog';

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
      showToast('Key required', 'error', 'Please enter your API key first.');
      return;
    }

    setIsTesting(true);
    setIsTested(false);
    try {
      const models = await fetchModels(apiKeyInput);
      if (models && models.length > 0) {
        setIsTested(true);
        showToast('Success', 'success', 'Connection validated successfully.');
      } else {
        throw new Error('Authenticated but no active models returned.');
      }
    } catch (e: any) {
      showToast('Authentication Failed', 'error', e?.message || 'Invalid Key.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
    showToast('Saved', 'success', 'API key configured.');
  };

  const handleRemoveKey = () => {
    setApiKey('');
    setApiKeyInput('');
    setIsTested(false);
    showToast('Key Removed', 'info', 'OpenRouter API Key deleted.');
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    showToast('Theme Updated', 'success', `Theme switched to ${theme}.`);
  };

  const handleFontSizeChange = (fontSize: 'sm' | 'base' | 'lg') => {
    updateSettings({ fontSize });
    showToast('Font Size Updated', 'success', 'Font settings synced.');
  };

  // Compile JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      version: 1,
      timestamp: Date.now(),
      settings,
      sessions,
      notes,
      library,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartprep-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup Created', 'success', 'All local workspace data compiled and downloaded.');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const backup = JSON.parse(raw);

        if (!backup.version || !backup.settings) {
          throw new Error('Invalid backup schema.');
        }

        // Apply backup states to Zustand
        if (backup.settings) {
          useSettingsStore.setState({ settings: backup.settings });
          setApiKeyInput(backup.settings.apiKey);
        }
        if (backup.sessions) useChatStore.setState({ sessions: backup.sessions, activeSessionId: backup.sessions[0]?.id || null });
        if (backup.notes) useNotesStore.setState({ notes: backup.notes });
        if (backup.library) useNotesStore.setState({ library: backup.library });

        showToast('Backup Restored', 'success', 'Workspace successfully migrated.');
      } catch (err) {
        showToast('Restoration Failed', 'error', 'Backup file corrupt or invalid.');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeAllData = () => {
    // Delete all localStorage states
    resetSettings();
    clearAllSessions();
    clearAllNotesAndLibrary();
    setApiKeyInput('');
    setIsTested(false);
    setShowClearConfirm(false);
    showToast('Wipe Complete', 'info', 'All local records successfully erased.');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-xs">
      
      {/* Top Header */}
      <div className="h-14 border-b border-border px-6 flex items-center justify-between flex-shrink-0 bg-card select-none">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Settings Console</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Control API integrations, layouts, backup parameters, and theme profiles.</p>
        </div>
      </div>

      {/* Grid container */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6 select-none">
          
          {/* Box 1: OpenRouter Credentials */}
          <div className="bg-card border border-border rounded-lg p-5 flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-foreground font-semibold">
              <Key className="h-4 w-4 text-primary" />
              <span>OpenRouter Credentials</span>
            </div>

            <div className="relative">
              <Input
                label="API Key"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setIsTested(false);
                }}
                className="pr-16"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-[2.1rem] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex space-x-3.5 pt-1">
              <Button variant="outline" onClick={handleTestConnection} isLoading={isTesting} className="font-semibold">
                Test Connection
              </Button>
              <Button onClick={handleSaveApiKey} disabled={apiKeyInput === settings.apiKey} className="font-semibold">
                Save Key
              </Button>
              {settings.apiKey && (
                <Button variant="ghost" onClick={handleRemoveKey} className="text-destructive hover:bg-destructive/10 font-semibold">
                  Remove Key
                </Button>
              )}

              {isTested && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center px-4 rounded text-xs font-semibold space-x-1.5 animate-in zoom-in-95">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Visual Interface Preferences */}
          <div className="bg-card border border-border rounded-lg p-5 flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-foreground font-semibold">
              <Sliders className="h-4 w-4 text-primary" />
              <span>Workspace Preferences</span>
            </div>

            {/* Theme picker buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Theme Profile
              </label>
              <div className="grid grid-cols-3 gap-3 pt-1 max-w-sm">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex items-center justify-center space-x-2 p-2.5 rounded border transition-all cursor-pointer ${
                    settings.theme === 'dark'
                      ? 'bg-primary/5 border-primary text-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span>Dark Mode</span>
                </button>

                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex items-center justify-center space-x-2 p-2.5 rounded border transition-all cursor-pointer ${
                    settings.theme === 'light'
                      ? 'bg-primary/5 border-primary text-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Light Mode</span>
                </button>

                <button
                  onClick={() => handleThemeChange('system')}
                  className={`flex items-center justify-center space-x-2 p-2.5 rounded border transition-all cursor-pointer ${
                    settings.theme === 'system'
                      ? 'bg-primary/5 border-primary text-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Monitor className="h-4 w-4 text-sky-400" />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Font Picker & Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-2">
              <Select
                label="Message Font Size"
                value={settings.fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value as any)}
                options={[
                  { label: 'Small (Compact lines)', value: 'sm' },
                  { label: 'Standard', value: 'base' },
                  { label: 'Large (Easy visibility)', value: 'lg' },
                ]}
              />

              <Select
                label="Auto-Title Conversations"
                value={settings.autoTitle ? 'true' : 'false'}
                onChange={(e) => updateSettings({ autoTitle: e.target.value === 'true' })}
                options={[
                  { label: 'Enabled (AI generated titles)', value: 'true' },
                  { label: 'Disabled (Keep Default titles)', value: 'false' },
                ]}
              />
            </div>
          </div>

          {/* Box 3: Data Migration Options */}
          <div className="bg-card border border-border rounded-lg p-5 flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-foreground font-semibold">
              <Download className="h-4 w-4 text-primary" />
              <span>Data Migration & Backups</span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Export comprehensive backups of all settings, chat records, quiz histories, saved cards, and library textbook notes in a single JSON schema. Restore backups dynamically.
            </p>

            <div className="flex flex-wrap gap-3.5 pt-1.5">
              <Button variant="outline" onClick={handleExportBackup} className="font-semibold flex items-center space-x-1.5 h-9.5">
                <Download className="h-4 w-4" />
                <span>Export JSON Backup</span>
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Button variant="outline" className="font-semibold flex items-center space-x-1.5 h-9.5">
                  <Upload className="h-4 w-4" />
                  <span>Import JSON Backup</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setShowClearConfirm(true)}
                className="text-destructive hover:bg-destructive/10 font-semibold flex items-center space-x-1.5 h-9.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All Local Data</span>
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Wipe Confirmation Dialog */}
      <Dialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Wipe Local Workspace Data"
        footer={
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleWipeAllData}>
              Wipe Everything
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Are you absolutely sure you want to delete all local API keys, persistent configurations, conversation threads, saved study notes, and textbook documents? This action is destructive and cannot be undone.
        </p>
      </Dialog>
    </div>
  );
};
export default SettingsConsole;
