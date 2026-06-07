'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Wrench,
  FileText,
  Library,
  Settings,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pin,
  Trash2,
  GraduationCap,
} from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import { useSettingsStore } from '../../stores/settings-store';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/cn';
import { sidebarVariants, fadeUp, staggerContainer, springTransition } from '../../lib/utils/animations';

interface SidebarProps {
  activeTab: 'chat' | 'notes' | 'settings';
  setActiveTab: (tab: 'chat' | 'notes' | 'settings') => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed
}) => {
  const {
    sessions,
    activeSessionId,
    deleteSession,
    selectSession,
    togglePinSession,
    searchQuery,
    setSearchQuery,
    isRightPanelOpen,
    setIsRightPanelOpen,
    activeRightTab,
    setActiveRightTab
  } = useChatStore();


  const { settings } = useSettingsStore();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { renameSession } = useChatStore();

  const handleOpenWorkspace = (tab: 'artifacts' | 'library' | 'notes') => {
    setActiveRightTab(tab);
    setIsRightPanelOpen(true);
    setActiveTab('chat');
  };

  const handleCreateChat = () => {
    selectSession(null);
    setActiveTab('chat');
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const getGroupedSessions = () => {
    const today: typeof sessions = [];
    const yesterday: typeof sessions = [];
    const thisWeek: typeof sessions = [];
    const older: typeof sessions = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfThisWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

    filteredSessions.forEach((s) => {
      if (s.isPinned) return;
      if (s.updatedAt >= startOfToday) {
        today.push(s);
      } else if (s.updatedAt >= startOfYesterday) {
        yesterday.push(s);
      } else if (s.updatedAt >= startOfThisWeek) {
        thisWeek.push(s);
      } else {
        older.push(s);
      }
    });

    return { today, yesterday, thisWeek, older };
  };

  const { today, yesterday, thisWeek, older } = getGroupedSessions();
  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const saveRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };


  const renderSessionItem = (s: typeof sessions[0]) => {
    const isActive = activeSessionId === s.id && activeTab === 'chat';
    const isEditing = editingSessionId === s.id;

    return (
      <motion.div
        layout
        variants={fadeUp}
        key={s.id}
        onClick={() => {
          selectSession(s.id);
          setActiveTab('chat');
        }}
        className={cn(
          'group relative flex flex-col p-3 rounded-xl cursor-pointer transition-all border select-none mb-2',
          isActive
            ? 'bg-card border-border/60 shadow-sm'
            : 'border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
        )}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <MessageSquare className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground/40")} />
          
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => saveRename(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename(s.id);
                if (e.key === 'Escape') setEditingSessionId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="flex-1 bg-background border border-primary/30 px-2 py-0.5 rounded-lg outline-none text-xs text-foreground font-semibold"
            />
          ) : (
            <span
              className="flex-1 truncate text-xs font-semibold text-foreground pr-8 leading-tight"
              onDoubleClick={(e) => startEditing(s.id, s.title, e)}
            >
              {s.title}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground/40 mt-2 font-medium">
          <span>{s.messages.length} messages</span>
          <span>
            {new Date(s.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {!isEditing && (
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); togglePinSession(s.id); }}
              className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-primary rounded-lg transition-colors"
            >
              <Pin className={cn("h-3 w-3", s.isPinned && "fill-primary text-primary")} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
              className="p-1.5 hover:bg-destructive/5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      className="h-[calc(100vh-32px)] m-4 rounded-[28px] bg-background border border-border/40 flex flex-col relative select-none overflow-hidden z-20 shadow-sm"
    >
      {/* Header section */}
      <div className={cn("p-5 flex flex-col space-y-4", isCollapsed && "items-center p-4")}>
        <div className="flex items-center justify-between w-full">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div 
                key="expanded-header"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center space-x-3"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="font-bold text-[13px] tracking-tight text-foreground leading-none">SmartPrep</span>
                  <span className="text-[9px] text-muted-foreground/50 font-bold mt-1 uppercase tracking-wider leading-none">AI Workspace</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="collapsed-header"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
              >
                <GraduationCap className="h-5 w-5 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-8 h-8 flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground transition-all mt-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-5 py-2 relative flex items-center group">
          <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-secondary/50 border border-border/40 rounded-xl pl-10 pr-4 text-[11px] font-medium outline-none focus:ring-1 focus:ring-primary/20 focus:bg-secondary placeholder:text-muted-foreground/30 transition-all"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-4 pt-4">
            <button
              onClick={() => { setActiveTab('chat'); setIsCollapsed(false); }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                activeTab === 'chat' && !isRightPanelOpen ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title="Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <button
              onClick={() => handleOpenWorkspace('library')}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isRightPanelOpen && activeRightTab === 'library' ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title="Resources"
            >
              <Library className="h-5 w-5" />
            </button>

            <button
              onClick={() => handleOpenWorkspace('notes')}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isRightPanelOpen && activeRightTab === 'notes' ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title="Study Notes"
            >
              <FileText className="h-5 w-5" />
            </button>

          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            {pinnedSessions.length > 0 && (
              <div className="mb-6">
                <span className="px-2 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] flex items-center mb-3">
                  Pinned
                </span>
                {pinnedSessions.map(renderSessionItem)}
              </div>
            )}

            {today.length > 0 && (
              <div className="mb-6">
                <span className="px-2 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] block mb-3">Today</span>
                {today.map(renderSessionItem)}
              </div>
            )}

            {yesterday.length > 0 && (
              <div className="mb-6">
                <span className="px-2 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] block mb-3">Yesterday</span>
                {yesterday.map(renderSessionItem)}
              </div>
            )}

            {thisWeek.length > 0 && (
              <div className="mb-6">
                <span className="px-2 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] block mb-3">Last 7 Days</span>
                {thisWeek.map(renderSessionItem)}
              </div>
            )}

            {older.length > 0 && (
              <div className="mb-6">
                <span className="px-2 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] block mb-3">Older</span>
                {older.map(renderSessionItem)}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className="mt-auto border-t border-border/40 p-4 flex items-center justify-between flex-shrink-0 bg-background/50">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-all",
              activeTab === 'settings' && "bg-secondary text-primary"
            )}
            title="Settings"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          
          <button
            onClick={() => handleOpenWorkspace('library')}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
              isRightPanelOpen && activeRightTab === 'library' ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title="Resources"
          >
            <Library className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => handleOpenWorkspace('notes')}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
              isRightPanelOpen && activeRightTab === 'notes' ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title="Study Notes"
          >
            <FileText className="h-4.5 w-4.5" />
          </button>

        </div>

        {!isCollapsed ? (
          <Button
            variant="primary"
            onClick={handleCreateChat}
            className="text-[10px] font-black uppercase tracking-widest px-4 h-9 rounded-xl shadow-none"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            New Chat
          </Button>
        ) : (
          <Button
            variant="primary"
            size="icon"
            onClick={handleCreateChat}
            className="h-9 w-9 rounded-xl shadow-none"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
