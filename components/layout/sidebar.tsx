'use client';

import React, { useState } from 'react';
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
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import { useSettingsStore } from '../../stores/settings-store';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/cn';

interface SidebarProps {
  activeTab: 'chat' | 'tools' | 'notes' | 'library' | 'settings';
  setActiveTab: (tab: 'chat' | 'tools' | 'notes' | 'library' | 'settings') => void;
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
    createSession,
    deleteSession,
    selectSession,
    togglePinSession,
    searchQuery,
    setSearchQuery
  } = useChatStore();

  const { settings } = useSettingsStore();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { renameSession } = useChatStore();

  const handleCreateChat = () => {
    const id = createSession(settings.defaultModel);
    setActiveTab('chat');
    selectSession(id);
  };

  // Group sessions by date
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
      if (s.isPinned) return; // Handle pinned separately at the top
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

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const renderSessionItem = (s: typeof sessions[0]) => {
    const isActive = activeSessionId === s.id && activeTab === 'chat';
    const isEditing = editingSessionId === s.id;

    return (
      <div
        key={s.id}
        onClick={() => {
          selectSession(s.id);
          setActiveTab('chat');
        }}
        className={cn(
          'group relative flex flex-col p-3 rounded-lg cursor-pointer transition-all border border-border bg-card mb-2 hover:bg-muted/30 select-none shadow-sm',
          isActive
            ? 'border-primary ring-1 ring-primary/50 font-medium'
            : 'border-border text-muted-foreground hover:text-foreground'
        )}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <MessageSquare className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground/60")} />
          
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
              className="flex-1 bg-background border border-primary px-1.5 py-0.5 rounded outline-none text-xs text-foreground font-semibold"
            />
          ) : (
            <span
              className="flex-1 truncate text-xs font-bold text-foreground pr-8 leading-tight"
              onDoubleClick={(e) => startEditing(s.id, s.title, e)}
            >
              {s.title}
            </span>
          )}
        </div>

        {/* Info row showing message counts and edit dates exactly like old */}
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 mt-2 font-semibold select-none">
          <span>{s.messages.length} messages</span>
          <span>
            {new Date(s.updatedAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {!isEditing && (
          <div className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePinSession(s.id);
              }}
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded cursor-pointer"
            >
              <Pin className={cn("h-3 w-3", s.isPinned && "fill-primary text-primary")} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSession(s.id);
              }}
              className="p-1 hover:bg-muted text-muted-foreground hover:text-destructive rounded cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-secondary border-r border-border transition-all duration-300 relative select-none',
        isCollapsed ? 'w-[64px]' : 'w-[280px]'
      )}
    >
      {/* Top Header */}
      <div className={cn("p-5 flex flex-col space-y-4 border-b border-border select-none", isCollapsed && "items-center justify-center p-4")}>
        <div className="flex items-center justify-between w-full">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3.5">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/7a61c456db2d140b6cd59cf12f5fcf71accbfcbbe0a54f71e7d93005240461e2?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79"
                alt="SmartPrep Logo"
                className="w-8 h-8 rounded-full animate-[spin_8s_linear_infinite]"
              />
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-foreground leading-tight">
                  SmartPrep
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Build your own AI Companion.
                </span>
              </div>
            </div>
          ) : (
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/7a61c456db2d140b6cd59cf12f5fcf71accbfcbbe0a54f71e7d93005240461e2?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79"
              alt="SmartPrep Logo"
              className="w-8 h-8 rounded-full animate-[spin_8s_linear_infinite] mt-1"
            />
          )}

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="h-6 w-6 hover:bg-muted text-muted-foreground hover:text-foreground rounded flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapsible/Expandable Trigger when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8 bg-card border border-border rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shadow-sm mt-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Quick action bar buttons below header exactly like old */}
        {!isCollapsed && (
          <div className="flex space-x-2 pt-1 select-none">
            <button
              onClick={() => setActiveTab('tools')}
              className={cn(
                "flex-1 py-1.5 px-2 bg-card hover:bg-muted border border-border text-foreground hover:text-primary rounded text-[10px] font-semibold transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1.5",
                activeTab === 'tools' && "border-primary/50 text-primary bg-primary/5"
              )}
            >
              <Wrench className="h-3 w-3" />
              <span>Masks</span>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                "flex-1 py-1.5 px-2 bg-card hover:bg-muted border border-border text-foreground hover:text-primary rounded text-[10px] font-semibold transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1.5",
                activeTab === 'library' && "border-primary/50 text-primary bg-primary/5"
              )}
            >
              <Library className="h-3 w-3" />
              <span>Discovery</span>
            </button>
          </div>
        )}
      </div>

      {/* Search (Hide when collapsed) */}
      {!isCollapsed && (
        <div className="px-5 py-3 relative flex items-center">
          <Search className="absolute left-8 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 bg-card border border-border rounded-md pl-9 pr-3 text-xs outline-none focus:border-primary placeholder:text-muted-foreground transition-all"
          />
        </div>
      )}

      {/* Conversation List / Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-2 select-none">
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-3.5 pt-4">
            <button
              onClick={() => {
                setActiveTab('chat');
                setIsCollapsed(false);
              }}
              className={cn(
                "h-9 w-9 bg-card border border-border rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shadow-sm",
                activeTab === 'chat' && "border-primary text-primary"
              )}
            >
              <MessageSquare className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => {
                setActiveTab('tools');
                setIsCollapsed(false);
              }}
              className={cn(
                "h-9 w-9 bg-card border border-border rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shadow-sm",
                activeTab === 'tools' && "border-primary text-primary"
              )}
            >
              <Wrench className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => {
                setActiveTab('library');
                setIsCollapsed(false);
              }}
              className={cn(
                "h-9 w-9 bg-card border border-border rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shadow-sm",
                activeTab === 'library' && "border-primary text-primary"
              )}
            >
              <Library className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <>
            {/* Pinned Chats */}
            {pinnedSessions.length > 0 && (
              <div className="mb-4">
                <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center mb-1.5">
                  <Pin className="h-2.5 w-2.5 mr-1 text-primary fill-primary" />
                  Pinned
                </span>
                {pinnedSessions.map(renderSessionItem)}
              </div>
            )}

            {/* Today */}
            {today.length > 0 && (
              <div className="mb-4 animate-in fade-in duration-200">
                <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Today
                </span>
                {today.map(renderSessionItem)}
              </div>
            )}

            {/* Yesterday */}
            {yesterday.length > 0 && (
              <div className="mb-4">
                <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Yesterday
                </span>
                {yesterday.map(renderSessionItem)}
              </div>
            )}

            {/* This Week */}
            {thisWeek.length > 0 && (
              <div className="mb-4">
                <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Last 7 Days
                </span>
                {thisWeek.map(renderSessionItem)}
              </div>
            )}

            {/* Older */}
            {older.length > 0 && (
              <div className="mb-4">
                <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Older
                </span>
                {older.map(renderSessionItem)}
              </div>
            )}

            {/* Empty list state */}
            {filteredSessions.length === 0 && (
              <div className="text-center py-10 text-[11px] text-muted-foreground">
                No chats found
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Navigation bar styled EXACTLY like old sidebar-tail */}
      <div className="mt-auto border-t border-border p-4 bg-muted/10 flex items-center justify-between flex-shrink-0 select-none">
        
        {/* Left Primary actions: Settings & Saved Notes */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "p-2 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded-lg shadow-sm cursor-pointer transition-all",
              activeTab === 'settings' && "border-primary text-primary bg-primary/5"
            )}
            title="Settings Console"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              "p-2 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground rounded-lg shadow-sm cursor-pointer transition-all",
              activeTab === 'notes' && "border-primary text-primary bg-primary/5"
            )}
            title="Saved Study Notes"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>

        {/* Right Secondary action: Add/New Chat button */}
        {!isCollapsed ? (
          <Button
            variant="outline"
            onClick={handleCreateChat}
            className="text-xs font-semibold px-3 h-9 flex items-center space-x-1.5 bg-card hover:bg-muted transition-all select-none border border-border"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={handleCreateChat}
            className="h-8 w-8 rounded-md bg-card border border-border"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
export default Sidebar;
