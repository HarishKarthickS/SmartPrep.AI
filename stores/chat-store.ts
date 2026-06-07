import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatSession, ChatMessage } from '../types/chat';
import { db } from '../lib/db/dexie';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isStreaming: boolean;
  isTitling: boolean;
  searchQuery: string;
  activeController: AbortController | null;
  initStore: () => Promise<void>;
  createSession: (model: string, systemPrompt?: string, temperature?: number) => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
  selectSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: ChatMessage) => Promise<void>;
  updateMessage: (sessionId: string, messageId: string, content: string) => Promise<void>;
  updateReasoning: (sessionId: string, messageId: string, reasoning: string) => Promise<void>;
  deleteMessage: (sessionId: string, messageId: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  updateMetadata: (id: string, title: string, subtitle: string) => Promise<void>;
  togglePinSession: (id: string) => Promise<void>;
  setStreaming: (streaming: boolean) => void;
  setIsTitling: (isTitling: boolean) => void;
  setController: (controller: AbortController | null) => void;
  setSearchQuery: (query: string) => void;
  clearAllSessions: () => Promise<void>;
  attachContext: (sessionId: string, type: 'note' | 'library', id: string) => Promise<void>;
  detachContext: (sessionId: string, type: 'note' | 'library', id: string) => Promise<void>;
  forkSession: (sessionId: string, messageId: string) => Promise<string>;
  activeArtifact: { code: string; language: string; title: string } | null;
  setActiveArtifact: (artifact: { code: string; language: string; title: string } | null) => void;
  activeRightTab: 'artifacts' | 'library' | 'notes';
  setActiveRightTab: (tab: 'artifacts' | 'library' | 'notes') => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isStreaming: false,
      isTitling: false,
      searchQuery: '',
      activeController: null,
      activeArtifact: null,
      activeRightTab: 'artifacts',
      isRightPanelOpen: true,

      initStore: async () => {
        const sessions = await db.sessions.toArray();
        const fullSessions = await Promise.all(
          sessions.map(async (s) => {
            const messages = await db.messages
              .where('sessionId')
              .equals(s.id)
              .sortBy('timestamp');
            return { ...s, messages } as ChatSession;
          })
        );
        
        // Sort sessions: pinned first, then by updatedAt
        const sorted = fullSessions.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.updatedAt - a.updatedAt;
        });

        set({ sessions: sorted });
      },

      createSession: async (model, systemPrompt, temperature = 0.7) => {
        const id = Math.random().toString(36).substring(2, 15);
        const newSession: ChatSession = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model,
          systemPrompt: systemPrompt || 'You are SmartPrep AI, a premium intelligent tutor. Always be conversational, helpful and accurate. DO NOT output safety ratings, headers, or metadata. Just respond to the user query directly.',
          temperature,
          isPinned: false,
          attachedContexts: [],
        };

        // Write to Dexie (excluding messages which is separate table)
        const { messages, ...sessionData } = newSession;
        await db.sessions.add(sessionData);

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }));

        return id;
      },

      deleteSession: async (id) => {
        await db.sessions.delete(id);
        await db.messages.where('sessionId').equals(id).delete();
        
        set((state) => {
          const filtered = state.sessions.filter((s) => s.id !== id);
          let newActive = state.activeSessionId;
          if (state.activeSessionId === id) {
            newActive = filtered.length > 0 ? filtered[0].id : null;
          }
          return {
            sessions: filtered,
            activeSessionId: newActive,
          };
        });
      },

      selectSession: (id) => set({ activeSessionId: id }),

      addMessage: async (sessionId, message) => {
        await db.messages.add({ ...message, sessionId });
        await db.sessions.update(sessionId, { updatedAt: Date.now() });

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: [...s.messages, message],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      updateMessage: async (sessionId, messageId, content) => {
        await db.messages.update(messageId, { content });
        await db.sessions.update(sessionId, { updatedAt: Date.now() });

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, content } : m
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      updateReasoning: async (sessionId, messageId, reasoning) => {
        await db.messages.update(messageId, { reasoning });
        
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, reasoning } : m
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      deleteMessage: async (sessionId, messageId) => {
        await db.messages.delete(messageId);
        
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.filter((m) => m.id !== messageId),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      renameSession: async (id, title) => {
        await db.sessions.update(id, { title, updatedAt: Date.now() });
        
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          ),
        }));
      },

      updateMetadata: async (id, title, subtitle) => {
        await db.sessions.update(id, { title, subtitle, updatedAt: Date.now() });
        
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, subtitle, updatedAt: Date.now() } : s
          ),
        }));
      },

      togglePinSession: async (id) => {
        const session = get().sessions.find(s => s.id === id);
        if (!session) return;
        const newPinned = !session.isPinned;
        await db.sessions.update(id, { isPinned: newPinned });

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, isPinned: newPinned } : s
          ).sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.updatedAt - a.updatedAt;
          }),
        }));
      },

      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setIsTitling: (isTitling) => set({ isTitling }),
      setController: (controller) => set({ activeController: controller }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      clearAllSessions: async () => {
        await db.sessions.clear();
        await db.messages.clear();
        set({ sessions: [], activeSessionId: null });
      },

      attachContext: async (sessionId, type, id) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        const exists = session.attachedContexts?.some((c) => c.type === type && c.id === id);
        if (exists) return;
        
        const newContexts = [...(session.attachedContexts || []), { type, id }];
        await db.sessions.update(sessionId, { attachedContexts: newContexts, updatedAt: Date.now() });

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              attachedContexts: newContexts,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      detachContext: async (sessionId, type, id) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;

        const newContexts = (session.attachedContexts || []).filter(
          (c) => !(c.type === type && c.id === id)
        );
        await db.sessions.update(sessionId, { attachedContexts: newContexts, updatedAt: Date.now() });

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              attachedContexts: newContexts,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      forkSession: async (sessionId, messageId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return '';

        const messageIndex = session.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return '';

        const newId = Math.random().toString(36).substring(2, 15);
        const slicedMessages = session.messages.slice(0, messageIndex + 1);

        const newSession: ChatSession = {
          ...session,
          id: newId,
          title: `${session.title} (Fork)`,
          messages: slicedMessages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPinned: false,
        };

        const { messages, ...sessionData } = newSession;
        await db.sessions.add(sessionData);
        
        await Promise.all(slicedMessages.map(m => 
          db.messages.add({ ...m, sessionId: newId })
        ));

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newId,
        }));

        return newId;
      },

      setActiveArtifact: (artifact) => set({ activeArtifact: artifact }),
      setActiveRightTab: (tab) => set({ activeRightTab: tab }),
      setIsRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
    }),
    {
      name: 'smartprep-chats',
      version: 2,
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        // sessions are now in Dexie
      }),
      onRehydrateStorage: () => (state) => {
        state?.initStore();
      }
    }
  )
);
