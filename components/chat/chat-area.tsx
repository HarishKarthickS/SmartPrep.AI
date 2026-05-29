'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, Trash2, ArrowDown, HelpCircle, StopCircle, RefreshCw } from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useToastStore } from '../../stores/toast-store';
import { streamChatCompletions } from '../../lib/openrouter/client';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';

export const ChatArea: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    isStreaming,
    activeController,
    addMessage,
    updateMessage,
    deleteMessage,
    setStreaming,
    setController,
    renameSession,
  } = useChatStore();

  const { settings } = useSettingsStore();
  const { showToast } = useToastStore();
  
  const [inputVal, setInputVal] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [activeSession?.messages?.length, isStreaming]);

  // Check scroll height to display "Scroll to bottom" button
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    setShowScrollBtn(!isAtBottom);
  };

  const handleAbort = () => {
    if (activeController) {
      activeController.abort();
      setController(null);
      setStreaming(false);
      showToast('Generation Stopped', 'info', 'AI response stream canceled by user.');
    }
  };

  const handleTriggerAIStream = async (messageList: any[]) => {
    if (!activeSessionId) return;

    const controller = new AbortController();
    setController(controller);
    setStreaming(true);

    const tempMessageId = Math.random().toString(36).substring(2, 15);
    
    // Add empty assistant response node to render stream
    addMessage(activeSessionId, {
      id: tempMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: activeSession?.model || settings.defaultModel,
    });

    let currentResponse = '';

    await streamChatCompletions({
      apiKey: settings.apiKey,
      model: activeSession?.model || settings.defaultModel,
      messages: messageList,
      temperature: activeSession?.temperature,
      signal: controller.signal,
      onChunk: (chunk) => {
        currentResponse += chunk;
        updateMessage(activeSessionId, tempMessageId, currentResponse);
      },
      onError: (err) => {
        updateMessage(
          activeSessionId,
          tempMessageId,
          `⚠️ **OpenRouter API Error:**\n\n> ${err}\n\n*Please verify your API key, connection state, or balance levels under Settings.*`
        );
        showToast('Stream Error', 'error', err);
        setStreaming(false);
        setController(null);
      },
      onStart: () => {
        // Stream starting
      }
    });

    setStreaming(false);
    setController(null);

    // Auto title generation if it's the first exchange
    if (settings.autoTitle && messageList.filter(m => m.role === 'user').length === 1 && currentResponse) {
      generateAutoTitle(messageList[0].content);
    }
  };

  const handleSubmitPrompt = async () => {
    if (!inputVal.trim() || !activeSessionId || !activeSession) return;
    
    if (!settings.apiKey) {
      showToast('API Key Required', 'error', 'Please enter your OpenRouter key in Settings or Onboarding.');
      return;
    }

    const promptText = inputVal.trim();
    setInputVal('');

    const userMsg = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user' as const,
      content: promptText,
      timestamp: Date.now(),
    };

    addMessage(activeSessionId, userMsg);

    // Run AI Stream
    const currentMessages = [...activeSession.messages, userMsg];
    await handleTriggerAIStream(currentMessages);
  };

  // Socratic / preset prompt selectors
  const handleSelectQuickPrompt = (prompt: string) => {
    setInputVal(prompt);
  };

  const handleRetryLast = async () => {
    if (!activeSessionId || !activeSession || activeSession.messages.length === 0) return;

    // Find last user message
    const msgs = [...activeSession.messages];
    const assistantIndex = msgs.findLastIndex((m) => m.role === 'assistant');
    if (assistantIndex !== -1) {
      deleteMessage(activeSessionId, msgs[assistantIndex].id);
    }

    const filteredMsgs = activeSession.messages.filter((m, i) => m.role === 'user' || i < assistantIndex);
    await handleTriggerAIStream(filteredMsgs);
  };

  const handleEditSubmit = async (messageId: string, newContent: string) => {
    if (!activeSessionId || !activeSession) return;

    // Update message content
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) => (m.id === messageId ? { ...m, content: newContent } : m)),
        };
      }),
    }));

    // Find the message index
    const index = activeSession.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    // Remove any assistant responses after this message
    const sliceMsgs = activeSession.messages.slice(0, index + 1).map((m) =>
      m.id === messageId ? { ...m, content: newContent } : m
    );

    // Update session content directly to trigger re-renders
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: sliceMsgs,
        };
      }),
    }));

    await handleTriggerAIStream(sliceMsgs);
  };

  const handleClearContext = () => {
    if (!activeSessionId) return;
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
      ),
    }));
    setShowClearConfirm(false);
    showToast('Context Cleared', 'info', 'Conversation history wiped.');
  };

  const generateAutoTitle = async (firstPrompt: string) => {
    if (!settings.apiKey || !activeSessionId) return;
    try {
      const summaryMsg = [
        {
          role: 'system',
          content: 'You are a precise tool. Generate a short 3-5 word title for a chat that starts with the prompt. Output ONLY the short title. No quotes, no explanations, no periods.',
        },
        {
          role: 'user',
          content: firstPrompt,
        },
      ];

      const res = await fetch('/api/openrouter/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-flash-1.5',
          messages: summaryMsg,
          temperature: 0.3,
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generatedTitle = data.choices?.[0]?.message?.content?.trim();
        if (generatedTitle) {
          renameSession(activeSessionId, generatedTitle);
        }
      }
    } catch (e) {
      console.warn('Auto title gen failed silently:', e);
    }
  };

  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3 animate-pulse-slow" />
        <h3 className="text-base font-semibold text-foreground">Welcome to SmartPrep Studio</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Select an existing conversation from the sidebar or click "+ New Chat" to begin.
        </p>
      </div>
    );
  }

  const isEmpty = activeSession.messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden select-text">
      
      {/* Top Header Bar */}
      <div className="h-14 border-b border-border px-6 flex items-center justify-between flex-shrink-0 bg-card select-none">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate max-w-[300px]">
            {activeSession.title}
          </h2>
          <p className="text-[10px] text-muted-foreground truncate max-w-[300px] mt-0.5">
            Running model: <span className="font-mono text-primary/80 font-bold">{activeSession.model}</span>
          </p>
        </div>

        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            className="text-muted-foreground hover:text-destructive h-8.5"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span>Clear Context</span>
          </Button>
        )}
      </div>

      {/* Stream messages container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
      >
        {isEmpty ? (
          /* Empty state prompt helpers */
          <div className="max-w-2xl mx-auto flex flex-col space-y-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-350 select-none">
            <div className="flex flex-col space-y-2 text-center">
              <div className="mx-auto bg-primary/10 p-3 rounded-md text-primary w-fit border border-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                How can I help you learn today?
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Ask simple or deep conceptual questions, paste homework problems, or test your comprehension.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
              <button
                onClick={() => handleSelectQuickPrompt('Explain quantum physics like I am five years old, focusing on qubits.')}
                className="p-4 bg-card border border-border rounded-lg text-left hover:border-primary/40 hover:bg-primary/5 transition-all text-xs cursor-pointer"
              >
                <p className="font-semibold text-foreground">Explain simply</p>
                <p className="text-muted-foreground mt-1 leading-normal">
                  "Explain quantum physics like I am five years old..."
                </p>
              </button>

              <button
                onClick={() => handleSelectQuickPrompt('Act as a Socratic tutor. Guide me through solving the equation f(x) = 2x^2 - 4x + 6 step-by-step.')}
                className="p-4 bg-card border border-border rounded-lg text-left hover:border-primary/40 hover:bg-primary/5 transition-all text-xs cursor-pointer"
              >
                <p className="font-semibold text-foreground">Socratic Math Tutor</p>
                <p className="text-muted-foreground mt-1 leading-normal">
                  "Guide me through solving the quadratic equation..."
                </p>
              </button>

              <button
                onClick={() => handleSelectQuickPrompt('Compare and contrast the mechanical causes of World War 1 vs World War 2 in bullet points.')}
                className="p-4 bg-card border border-border rounded-lg text-left hover:border-primary/40 hover:bg-primary/5 transition-all text-xs cursor-pointer"
              >
                <p className="font-semibold text-foreground">History Outline</p>
                <p className="text-muted-foreground mt-1 leading-normal">
                  "Compare causes of World War 1 vs World War 2..."
                </p>
              </button>

              <button
                onClick={() => handleSelectQuickPrompt('Debug this React hydration error. Why does my text mismatch on server vs client?')}
                className="p-4 bg-card border border-border rounded-lg text-left hover:border-primary/40 hover:bg-primary/5 transition-all text-xs cursor-pointer"
              >
                <p className="font-semibold text-foreground">React/Code Helper</p>
                <p className="text-muted-foreground mt-1 leading-normal">
                  "Debug this React hydration mismatch error..."
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {activeSession.messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                onRetry={m.role === 'assistant' && activeSession.messages[activeSession.messages.length - 1].id === m.id ? handleRetryLast : undefined}
                onEditSubmit={m.role === 'user' ? (newText) => handleEditSubmit(m.id, newText) : undefined}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll-to-bottom helper */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute right-8 bottom-32 bg-card border border-border text-foreground hover:bg-muted p-2 rounded-full shadow-lg transition-all z-20 cursor-pointer flex items-center justify-center"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-card">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            value={inputVal}
            onChange={setInputVal}
            onSubmit={handleSubmitPrompt}
            isStreaming={isStreaming}
            onAbort={isStreaming ? handleAbort : undefined}
          />
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <Dialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Conversation Context"
        footer={
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearContext}>
              Wipe Context
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Are you sure you want to clear all messages in this chat session? This action is permanent and cannot be undone.
        </p>
      </Dialog>
    </div>
  );
};
