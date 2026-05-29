'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/sidebar';
import { ChatArea } from '../components/chat/chat-area';
import { ToolsHub } from '../components/tools/tools-hub';
import { NotesBoard } from '../components/notes/notes-board';
import { LibraryBoard } from '../components/library/library-board';
import { SettingsConsole } from '../components/settings/settings-console';
import { Onboarding } from '../components/settings/onboarding';
import { useSettingsStore, initTheme } from '../stores/settings-store';
import { useChatStore } from '../stores/chat-store';
import { ToastContainer } from '../components/ui/toast';

export default function App() {
  const { settings, updateSettings } = useSettingsStore();
  const { sessions, createSession } = useChatStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'notes' | 'library' | 'settings'>('chat');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Sync mounted and initial settings/theme state
  useEffect(() => {
    setHasMounted(true);
    initTheme();
    // Hydrate the onboarded state
    setIsOnboarded(!!settings.apiKey);
  }, [settings.apiKey]);

  // If onboarded and there are no active chat sessions, auto-create a default session
  useEffect(() => {
    if (hasMounted && isOnboarded && sessions.length === 0 && settings.defaultModel) {
      createSession(settings.defaultModel);
    }
  }, [hasMounted, isOnboarded, sessions.length, settings.defaultModel]);

  if (!hasMounted) {
    return (
      <div className="min-h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4 text-zinc-50 font-sans">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest select-none">
          SmartPrep AI Studio Loading...
        </p>
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <>
        <Onboarding onComplete={() => setIsOnboarded(true)} />
        <ToastContainer />
      </>
    );
  }

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatArea />;
      case 'tools':
        return <ToolsHub />;
      case 'notes':
        return <NotesBoard />;
      case 'library':
        return <LibraryBoard />;
      case 'settings':
        return <SettingsConsole />;
      default:
        return <ChatArea />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans select-none antialiased">
      {/* Collapsible left navigation bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main panel displays */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {renderActiveContent()}
      </main>

      {/* Real-time floating alerts */}
      <ToastContainer />
    </div>
  );
}
