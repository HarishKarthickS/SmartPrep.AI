import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatSession, ChatMessage } from '../types/chat';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isStreaming: boolean;
  searchQuery: string;
  activeController: AbortController | null;
  createSession: (model: string, systemPrompt?: string, temperature?: number) => string;
  deleteSession: (id: string) => void;
  selectSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateMessage: (sessionId: string, messageId: string, content: string) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  renameSession: (id: string, title: string) => void;
  togglePinSession: (id: string) => void;
  setStreaming: (streaming: boolean) => void;
  setController: (controller: AbortController | null) => void;
  setSearchQuery: (query: string) => void;
  clearAllSessions: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isStreaming: false,
      searchQuery: '',
      activeController: null,

      createSession: (model, systemPrompt, temperature = 0.7) => {
        const id = Math.random().toString(36).substring(2, 15);
        const newSession: ChatSession = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model,
          systemPrompt,
          temperature,
          isPinned: false,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }));

        return id;
      },

      deleteSession: (id) =>
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
        }),

      selectSession: (id) => set({ activeSessionId: id }),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: [...s.messages, message],
              updatedAt: Date.now(),
            };
          }),
        })),

      updateMessage: (sessionId, messageId, content) =>
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
        })),

      deleteMessage: (sessionId, messageId) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.filter((m) => m.id !== messageId),
              updatedAt: Date.now(),
            };
          }),
        })),

      renameSession: (id, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          ),
        })),

      togglePinSession: (id) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, isPinned: !s.isPinned } : s
          ),
        })),

      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setController: (controller) => set({ activeController: controller }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      clearAllSessions: () => set({ sessions: [], activeSessionId: null }),
    }),
    {
      name: 'smartprep-chats',
      version: 1,
      // Exclude controllers and streaming from storage
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);
