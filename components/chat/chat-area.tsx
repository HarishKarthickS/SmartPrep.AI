'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, Trash2, ArrowDown, StopCircle, RefreshCw, Zap, BookOpen, Code, GraduationCap, ChevronDown, X, Library, FileText, Layout, Loader2, Maximize } from 'lucide-react';
import { useChatStore } from '../../stores/chat-store';
import { useNotesStore } from '../../stores/notes-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useToastStore } from '../../stores/toast-store';
import { streamChatCompletions, fetchModels } from '../../lib/openrouter/client';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ModelSelector } from '../ui/model-selector';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { cn } from '../../lib/utils/cn';
import { fadeUp, staggerContainer, springTransition } from '../../lib/utils/animations';
import { searchLibraryChunks, chunkText, generateEmbedding } from '../../lib/utils/embeddings';
import { parseFile } from '../../lib/utils/file-parser';
import { db } from '../../lib/db/dexie';

export const ChatArea: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    isStreaming,
    isTitling,
    activeController,
    addMessage,
    updateMessage,
    updateReasoning,
    deleteMessage,
    setStreaming,
    setIsTitling,
    setController,
    renameSession,
    updateMetadata,
    createSession,
    isRightPanelOpen,
    setIsRightPanelOpen,
    setActiveArtifact,
    setActiveRightTab,
    attachContext
  } = useChatStore();

  const { addLibraryItem } = useNotesStore();
  const { settings, updateSettings } = useSettingsStore();
  const { showToast } = useToastStore();
  
  const [inputVal, setInputVal] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);


  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [activeSession?.messages?.length, isStreaming]);

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
      showToast('Stopped', 'info', 'AI response stopped.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const data = e.dataTransfer.getData('application/smartprep-item');
    if (!data) return;

    try {
      const { type, id } = JSON.parse(data);
      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = await createSession(settings.defaultModel);
      }

      await attachContext(sessionId, type, id);
      showToast('Context Added', 'success', `Dropped ${type} attached to session.`);
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleFileAttach = async (file: File) => {
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession(settings.defaultModel);
    }

    setIsProcessingFile(true);
    showToast('Processing', 'info', `Indexing ${file.name} for chat...`);

    try {
      const parsedContent = await parseFile(file);
      const title = file.name.replace(/\.[^/.]+$/, "");
      
      const id = addLibraryItem({ 
        title, 
        content: parsedContent, 
        type: 'document', 
        tags: ['attached', file.type.split('/')[1]] 
      });

      // Chunk and embed for RAG
      const chunks = chunkText(parsedContent);
      const chunkPromises = chunks.map(async (chunk) => {
        const embedding = await generateEmbedding(chunk);
        return db.documentChunks.add({
          libraryItemId: id,
          content: chunk,
          embedding
        });
      });

      await Promise.all(chunkPromises);
      
      // Auto-attach to context
      await attachContext(sessionId, 'library', id);
      
      showToast('Attached', 'success', `${file.name} is now in context.`);
    } catch (error: any) {
      console.error('Attachment error:', error);
      showToast('Error', 'error', error.message || 'Failed to attach file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleTriggerAIStream = async (messageList: any[], targetSessionId?: string) => {
    const sessionId = targetSessionId || activeSessionId;
    if (!sessionId) return;

    const controller = new AbortController();
    setController(controller);
    setStreaming(true);

    const latestSession = useChatStore.getState().sessions.find(s => s.id === sessionId);
    if (!latestSession?.model) {
      showToast('Model Required', 'error', 'Please select a model for this session.');
      setStreaming(false);
      setController(null);
      return;
    }

    const tempMessageId = Math.random().toString(36).substring(2, 15);

    addMessage(sessionId, {
      id: tempMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: latestSession.model,
    });

    // --- CONTEXT INJECTION & SEMANTIC SEARCH ---
    const attachedContexts = latestSession?.attachedContexts || [];
    let injectionPrompt = '';

    if (attachedContexts.length > 0) {
      injectionPrompt = "\n\nUSE THE FOLLOWING STUDY MATERIALS TO GROUND YOUR ANSWERS:\n";

      const { notes, library } = useNotesStore.getState();
      const userQuery = messageList.filter(m => m.role === 'user').pop()?.content || '';
      
      const libraryItemIds = attachedContexts
        .filter(ctx => ctx.type === 'library')
        .map(ctx => ctx.id);

      // Perform semantic search if there are library items and a query
      let retrievedChunks: any[] = [];
      if (libraryItemIds.length > 0 && userQuery) {
        try {
          retrievedChunks = await searchLibraryChunks(userQuery, libraryItemIds, 4);
        } catch (e) {
          console.warn('Semantic search failed, falling back to full content:', e);
        }
      }

      attachedContexts.forEach(ctx => {
        if (ctx.type === 'note') {
          const note = notes.find(n => n.id === ctx.id);
          if (note) injectionPrompt += `\n[NOTE: ${note.title}]\n${note.content}\n`;
        } else if (ctx.type === 'library') {
          const item = library.find(l => l.id === ctx.id);
          if (item) {
            // Include relevant chunks first
            const relevantForThisItem = retrievedChunks.filter(c => c.libraryItemId === item.id);
            if (relevantForThisItem.length > 0) {
              injectionPrompt += `\n[DOCUMENT: ${item.title} (Relevant Segments)]\n`;
              relevantForThisItem.forEach(c => injectionPrompt += `${c.content}\n---\n`);
            } else {
              // Fallback to full content if not indexed or no query match (truncated if very long)
              injectionPrompt += `\n[DOCUMENT: ${item.title}]\n${item.content.slice(0, 5000)}\n`;
            }
          }
        }
      });
      injectionPrompt += "\n--- END OF STUDY MATERIALS ---\n";
    }

    const artifactInstructions = `
When explaining complex topics, you can create interactive study tools using artifacts.
FORMAT: Use <artifact title="Title" language="tsx">...</artifact> for interactive components (React/TSX).
Always include 'tsx' or 'html' in the language attribute. The artifact should be a self-contained component.
`;

    const baseSystemPrompt = latestSession?.systemPrompt || 'You are SmartPrep AI, an intelligent tutor. Always be conversational, helpful and accurate. DO NOT output safety ratings, headers, or metadata.';
    const finalSystemPrompt = baseSystemPrompt + artifactInstructions + injectionPrompt;

    const finalMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...messageList
    ];
    // -------------------------

    let currentResponse = '';
    let currentReasoning = '';
    let artifactExtracted = false;

    await streamChatCompletions({
      apiKey: settings.apiKey,
      model: latestSession?.model || settings.defaultModel,
      messages: finalMessages,
      temperature: latestSession?.temperature,
      signal: controller.signal,
      sessionId: sessionId, 
      onChunk: (contentChunk, reasoningChunk) => {
        if (reasoningChunk) {
          currentReasoning += reasoningChunk;
          updateReasoning(sessionId, tempMessageId, currentReasoning);
        }

        if (contentChunk) {
          currentResponse += contentChunk;

          // Robust multi-fragment safety artifact stripping
          const sanitizedResponse = currentResponse
            .replace(/User Safety:\s*safe\n?/gi, '')
            .replace(/Response Safety:\s*safe\n?/gi, '');

          updateMessage(sessionId, tempMessageId, sanitizedResponse);

          // Real-time Artifact Extraction
          if (currentResponse.includes('</artifact>') && !artifactExtracted) {
            const match = currentResponse.match(/<artifact\s+title="([^"]+)"\s+language="([^"]+)">([\s\S]*?)<\/artifact>/);
            if (match) {
              const [, title, language, code] = match;
              setActiveArtifact({ title, language, code: code.trim() });
              setActiveRightTab('artifacts');
              setIsRightPanelOpen(true);
              artifactExtracted = true;
              showToast('Artifact Generated', 'success', `View ${title} in the Workspace.`);
            }
          }
        }
      },
      onError: (err) => {
        updateMessage(
          sessionId,
          tempMessageId,
          `⚠️ **OpenRouter API Error:**\n\n> ${err}\n\n*Please verify your API key or balance levels.*`
        );
        showToast('Stream Error', 'error', err);
        setStreaming(false);
        setController(null);
      },
      onStart: () => {}
    });

    setStreaming(false);
    setController(null);

    if (settings.autoTitle && messageList.filter(m => m.role === 'user').length === 1 && currentResponse) {
      generateAutoTitle(messageList[0].content, sessionId);
    }
  };

  const handleSubmitPrompt = async (overridePrompt?: string) => {
    const text = (overridePrompt || inputVal).trim();
    if (!text) return;

    if (!settings.apiKey) {
      showToast('API Key Required', 'error', 'Please enter your API key in Settings.');
      return;
    }

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession(settings.defaultModel);
    }

    if (!overridePrompt) setInputVal('');

    const userMsg = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
    };

    await addMessage(sessionId, userMsg);

    // Use latest state
    const updatedSession = useChatStore.getState().sessions.find(s => s.id === sessionId);
    if (updatedSession) {
      await handleTriggerAIStream(updatedSession.messages, sessionId);
    }
  };


  const handleRetryLast = async () => {
    if (!activeSessionId) return;
    const latestSession = useChatStore.getState().sessions.find(s => s.id === activeSessionId);
    if (!latestSession || latestSession.messages.length === 0) return;

    const msgs = [...latestSession.messages];
    const assistantIndex = msgs.findLastIndex((m) => m.role === 'assistant');
    if (assistantIndex !== -1) {
      deleteMessage(activeSessionId, msgs[assistantIndex].id);
    }
    
    const filteredMsgs = latestSession.messages.filter((m, i) => 
      (m.role === 'user' || i < assistantIndex) && m.id !== (assistantIndex !== -1 ? msgs[assistantIndex].id : '')
    );
    await handleTriggerAIStream(filteredMsgs);
  };

  const handleEditSubmit = async (messageId: string, newContent: string) => {
    if (!activeSessionId) return;
    const latestSession = useChatStore.getState().sessions.find(s => s.id === activeSessionId);
    if (!latestSession) return;
    
    // Find the message index to slice correctly
    const index = latestSession.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    // Slice up to the edited message and update its content
    const slicedMessages = latestSession.messages.slice(0, index + 1).map((m) =>
      m.id === messageId ? { ...m, content: newContent } : m
    );

    // Single state update for the session messages
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: slicedMessages, updatedAt: Date.now() } : s
      ),
    }));

    // Re-trigger the stream from the new context
    await handleTriggerAIStream(slicedMessages);
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

  const handleSelectQuickPrompt = (prompt: string) => {
    handleSubmitPrompt(prompt);
  };

  const changeSessionModel = (modelId: string) => {
    if (!activeSessionId) {
       updateSettings({ defaultModel: modelId });
       setShowModelPicker(false);
       showToast('Global Model Set', 'success', `Next session will use ${modelId}.`);
       return;
    }
    
    // Update local session
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) => 
        s.id === activeSessionId ? { ...s, model: modelId } : s
      ),
    }));

    // Persist as new global default
    updateSettings({ defaultModel: modelId });
    
    setShowModelPicker(false);
    showToast('Model Switched', 'success', `Session now using ${modelId}. Default brain updated.`);
  };

  const generateAutoTitle = async (firstPrompt: string, sessionId: string) => {
    const { setIsTitling, updateMetadata, sessions } = useChatStore.getState();
    if (!settings.apiKey) return;

    const session = sessions.find(s => s.id === sessionId);
    const titlingModel = session?.model || settings.defaultModel;
    if (!titlingModel) return;

    setIsTitling(true);
    try {
      const summaryMsg = [
        { 
          role: 'system', 
          content: 'Output a JSON object with "title" (3-5 words) and "subtitle" (short descriptive phrase) for this chat based on the first message. FORMAT: {"title": "...", "subtitle": "..."}' 
        },
        { role: 'user', content: firstPrompt },
      ];

      const res = await fetch('/api/openrouter/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: titlingModel,
          messages: summaryMsg,
          temperature: 0.3,
          stream: false,
          session_id: sessionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          try {
            // Attempt to parse JSON response
            const metadata = JSON.parse(content.replace(/```json|```/g, ''));
            if (metadata.title && metadata.subtitle) {
              updateMetadata(sessionId, metadata.title, metadata.subtitle);
            }
          } catch {
            // Fallback if not JSON
            if (content.length < 100) updateMetadata(sessionId, content, 'Conversation');
          }
        }
      }
    } catch (e) {
      console.warn('Auto title gen failed:', e);
    } finally {
      setIsTitling(false);
    }
  };

  const isEmpty = !activeSession || activeSession.messages.length === 0;

  return (
    <div 
      className={cn(
        "flex-1 flex flex-col h-full bg-transparent relative overflow-hidden transition-all duration-300",
        isDraggingOver && "ring-2 ring-inset ring-primary/40 bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      
      {/* Immersive Academic Header */}
      <div className={cn(
        "h-16 px-6 flex items-center justify-between flex-shrink-0 z-10 transition-all duration-300",
        !isZenMode ? "bg-card/80 border-b border-border" : "bg-transparent"
      )}>
        <div className="min-w-0 flex items-center space-x-4">
          <div className="w-9 h-9 bg-secondary border border-border flex items-center justify-center text-primary flex-shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-[15px] font-serif font-bold text-foreground truncate max-w-[200px] leading-tight">
                {activeSession?.title || 'Open notebook'}
              </h2>
              {isTitling && (
                <Loader2 className="h-3 w-3 animate-spin text-primary/60" />
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <button 
                onClick={() => setShowModelPicker(true)}
                className="flex items-center space-x-1.5 group outline-none"
              >
                <span className="label-shelf group-hover:text-primary transition-colors leading-none">
                  {activeSession?.model || settings.defaultModel}
                </span>
                <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </button>

              {activeSession && activeSession.attachedContexts && activeSession.attachedContexts.length > 0 && (
                <>
                  <span className="text-muted-foreground/20 text-[10px]">•</span>
                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar max-w-[300px]">
                    {activeSession.attachedContexts.map((ctx) => {
                      const { notes, library } = useNotesStore.getState();
                      const item = ctx.type === 'note' ? notes.find(n => n.id === ctx.id) : library.find(l => l.id === ctx.id);
                      if (!item) return null;
                      return (
                        <div 
                          key={`${ctx.type}-${ctx.id}`}
                          className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-secondary border border-border/50 text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                        >
                          {ctx.type === 'note' ? <FileText className="h-2.5 w-2.5" /> : <Library className="h-2.5 w-2.5" />}
                          <span className="max-w-[60px] truncate leading-none">{item.title}</span>
                          <button 
                            onClick={() => useChatStore.getState().detachContext(activeSession.id, ctx.type, ctx.id)}
                            className="hover:text-destructive transition-colors ml-0.5"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsZenMode?.(!isZenMode)}
            className={cn(
              "rounded-xl transition-all h-9 px-3 flex items-center space-x-2 border border-transparent",
              isZenMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            )}
            title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
          >
            {isZenMode ? <Layout className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          {!isZenMode && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRightPanelOpen?.(!isRightPanelOpen)}
                className={cn(
                  "rounded-xl transition-all h-9 px-3 flex items-center space-x-2 border border-transparent",
                  isRightPanelOpen ? "bg-secondary text-primary border-primary/10 shadow-sm" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-[11px] font-sans leading-none">Margin</span>
              </Button>

              {!isEmpty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all h-9 w-9 p-0 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages Canvas */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto space-y-8 custom-scrollbar scroll-smooth transition-all duration-500",
          !isZenMode ? "px-6 py-8" : "px-[15%] py-12"
        )}
      >
        <AnimatePresence mode="popLayout">
          {isEmpty ? (
            <motion.div 
              key="empty-state"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="max-w-2xl mx-auto flex flex-col space-y-10 py-12"
            >
              <motion.div variants={fadeUp} className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-secondary border border-border flex items-center justify-center text-primary mb-2">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground">
                  What are you studying today?
                </h3>
                <p className="margin-note max-w-sm">
                  Local notes on the right. Ask in the middle. Nothing is hosted as a studio.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Explain Simply", icon: <Zap className="h-4 w-4"/>, text: "Explain quantum physics like I am five years old.", label: "CONCEPT" },
                  { title: "Socratic Tutor", icon: <BookOpen className="h-4 w-4"/>, text: "Guide me through solving a quadratic equation step-by-step.", label: "MATH" },
                  { title: "Code Helper", icon: <Code className="h-4 w-4"/>, text: "How do I implement a custom hook in React for data fetching?", label: "DEV" },
                  { title: "Summarize", icon: <GraduationCap className="h-4 w-4"/>, text: "Contrast the industrial revolution causes in UK vs USA.", label: "HISTORY" }
                ].map((item, i) => (
                  <motion.button
                    key={i}
                    variants={fadeUp}
                    onClick={() => handleSelectQuickPrompt(item.text)}
                    className="group paper-stack p-5 text-left transition-all duration-300 relative overflow-hidden hover:-translate-y-0.5"
                  >
                    <div className="flex items-center space-x-2.5 mb-2">
                      <div className="text-primary/60">{item.icon}</div>
                      <span className="label-shelf">{item.label}</span>
                    </div>
                    <p className="font-serif font-bold text-[15px] text-foreground mb-1">{item.title}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 font-serif">{item.text}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className={cn("mx-auto space-y-8 pb-20", !isZenMode ? "max-w-2xl" : "max-w-3xl")}>
              {activeSession && activeSession.messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onRetry={m.role === 'assistant' && activeSession.messages[activeSession.messages.length - 1].id === m.id ? handleRetryLast : undefined}
                  onEditSubmit={m.role === 'user' ? (newText) => handleEditSubmit(m.id, newText) : undefined}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-10" />
      </div>

      {/* Floating Scroll Button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute right-8 bottom-32 w-10 h-10 bg-card border border-border shadow-lg rounded-full flex items-center justify-center z-20 hover:scale-105 transition-transform"
          >
            <ArrowDown className="h-4 w-4 text-primary" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Academic Input Area */}
      <div className={cn(
        "pb-8 pt-2 flex-shrink-0 z-10 transition-all duration-500",
        !isZenMode ? "px-6" : "px-[15%]"
      )}>
        <div className={cn("mx-auto", !isZenMode ? "max-w-2xl" : "max-w-3xl")}>
          <ChatInput
            value={inputVal}
            onChange={setInputVal}
            onSubmit={() => handleSubmitPrompt()}
            isStreaming={isStreaming}
            onAbort={isStreaming ? handleAbort : undefined}
            onFileAttach={handleFileAttach}
            isProcessingFile={isProcessingFile}
          />
          <div className="mt-3 flex justify-center">
            <p className="label-shelf">
              Verify what you use. This app does not ship a model.
            </p>
          </div>
        </div>
      </div>

      {/* Wipe Confirmation */}
      <Dialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Conversation"
        footer={
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={() => setShowClearConfirm(false)} className="rounded-sm font-sans text-[12px]">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearContext} className="rounded-sm font-sans text-[12px]">
              Clear All
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
          This will permanently delete all messages in this session.
        </p>
      </Dialog>

      {/* Model Picker Overlay */}
      <AnimatePresence>
        {showModelPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm" 
              onClick={() => setShowModelPicker(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg paper-stack z-10 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary border border-border flex items-center justify-center text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-foreground">Pick a model</h3>
                </div>
                <button onClick={() => setShowModelPicker(false)} className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full text-muted-foreground transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6">
                <ModelSelector 
                  selectedModelId={activeSession?.model || settings.defaultModel} 
                  onSelect={changeSessionModel} 
                  apiKey={settings.apiKey}
                  maxHeight="400px"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
