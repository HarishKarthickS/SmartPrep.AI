'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Library, 
  FileText, 
  X,
  Code2,
  BookOpen,
  Layout
} from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import { ArtifactViewer } from '../artifacts/artifact-viewer';
import LibraryBoard from '../library/library-board';
import NotesBoard from '../notes/notes-board';
import { cn } from '../../lib/utils/cn';

export const Workspace: React.FC = () => {
  const { 
    activeRightTab, 
    setActiveRightTab, 
    setIsRightPanelOpen,
    activeArtifact
  } = useChatStore();

  const tabs = [
    { id: 'artifacts', label: 'Artifacts', icon: <Code2 className="h-3.5 w-3.5" /> },
    { id: 'library', label: 'Resources', icon: <Library className="h-3.5 w-3.5" /> },
    { id: 'notes', label: 'Study Notes', icon: <FileText className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Workspace Header with Tabs */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-border/40 bg-secondary/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Layout className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-foreground tracking-tight leading-none">AI Workspace</h2>
              <p className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest mt-1 leading-none">Interactive Tools</p>
            </div>
          </div>
          <button 
            onClick={() => setIsRightPanelOpen(false)}
            className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRightTab(tab.id)}
              className={cn(
                "relative px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 rounded-t-xl border-x border-t border-transparent",
                activeRightTab === tab.id 
                  ? "bg-card border-border/40 text-primary" 
                  : "text-muted-foreground/40 hover:text-foreground hover:bg-secondary/40"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'artifacts' && activeArtifact && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
              {activeRightTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeRightTab === 'artifacts' && (
            <motion.div
              key="artifacts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <ArtifactViewer />
            </motion.div>
          )}
          {activeRightTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <LibraryBoard />
            </motion.div>
          )}
          {activeRightTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <NotesBoard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
