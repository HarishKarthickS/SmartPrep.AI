'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/sidebar';
import { ChatArea } from '../components/chat/chat-area';
import { Workspace } from '../components/layout/workspace';
import SettingsConsole from '../components/settings/settings-console';

import { Onboarding } from '../components/settings/onboarding';
import { useSettingsStore, initTheme } from '../stores/settings-store';
import { useChatStore } from '../stores/chat-store';
import { ToastContainer } from '../components/ui/toast';
import { cn } from '../lib/utils/cn';
import { springTransition } from '../lib/utils/animations';

export default function App() {
  const { settings } = useSettingsStore();
  const { sessions, createSession, isRightPanelOpen, setIsRightPanelOpen } = useChatStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'settings'>('chat');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    initTheme();
    setIsOnboarded(!!settings.apiKey);
  }, [settings.apiKey]);


  if (!hasMounted) {
    return (
      <div className="min-h-screen w-screen desk flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-primary/10" />
          <div className="h-10 w-10 rounded-full border-t-2 border-primary animate-spin absolute inset-0" />
        </div>
        <p className="label-shelf animate-pulse">
          Opening the desk
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

  return (
    <div className="relative flex h-screen w-screen overflow-hidden desk font-serif select-none antialiased text-foreground">
      <div className="absolute inset-0 z-0 pointer-events-none" />

      <AnimatePresence>
        {!isZenMode && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={springTransition}
            className="z-30"
          >
            <Sidebar
              activeTab={activeTab === 'chat' && isRightPanelOpen ? 'notes' : activeTab}
              setActiveTab={setActiveTab}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main 
        className={cn(
          "flex-1 relative flex h-full overflow-hidden z-10 transition-all duration-500 ease-in-out",
          !isZenMode ? "p-4 pl-0 space-x-4" : "p-0"
        )}
      >
        {/* Center Panel (Chat or Settings) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab === 'settings' ? 'settings' : 'chat'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex flex-col h-full overflow-hidden transition-all duration-500 ease-in-out",
              isRightPanelOpen && activeTab !== 'settings' && !isZenMode ? "flex-[1.2]" : "flex-1"
            )}
          >
            <div className={cn(
              "flex-1 overflow-hidden relative bookmark-tab",
              !isZenMode ? "paper-stack paper-grain" : "bg-card border-none shadow-none"
            )}>
              {activeTab === 'settings' ? (
                <SettingsConsole />
              ) : (
                <ChatArea />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Panel (Workspace/Artifacts) */}
        <AnimatePresence>
          {isRightPanelOpen && activeTab !== 'settings' && !isZenMode && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={springTransition}
              className="flex-1 h-full flex flex-col z-20"
            >
              <div className="flex-1 paper-stack paper-grain overflow-hidden relative">
                <Workspace />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer />
    </div>
  );

}

