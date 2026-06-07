'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, FileText, Edit, RotateCcw, Sparkles, ChevronDown, ChevronUp, BrainCircuit, GraduationCap, GitFork, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { useChatStore } from '../../stores/chat-store';
import { useNotesStore } from '../../stores/notes-store';
import { useToastStore } from '../../stores/toast-store';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/cn';
import { fadeUp, springTransition } from '../../lib/utils/animations';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
  onEditSubmit?: (newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onEditSubmit
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(message.content);
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(true);
  const { addNote } = useNotesStore();
  const { showToast } = useToastStore();
  const { forkSession, activeSessionId, setActiveArtifact, setIsRightPanelOpen } = useChatStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied', 'success', 'Message content copied to clipboard.');
  };

  const handleFork = async () => {
    if (activeSessionId) {
      const newId = await forkSession(activeSessionId, message.id);
      if (newId) {
        showToast('Chat Branched', 'success', 'Started a new branch from this message.');
      }
    }
  };

  const handlePreviewArtifact = (code: string, language: string) => {
    setActiveArtifact({ code, language, title: 'AI Workspace Preview' });
    setIsRightPanelOpen(true);
    showToast('Artifact Ready', 'info', 'Rendering code in workspace panel.');
  };

  const handleSaveToNotes = () => {

    const defaultTitle = message.content.slice(0, 30).trim() + '...';
    const noteId = addNote({
      title: `AI Note: ${defaultTitle}`,
      content: message.content,
      tags: ['chat-export'],
      chatId: undefined,
    });

    if (noteId) {
      showToast('Saved to Notes', 'success', 'Successfully converted to a permanent study note.');
    }
  };

  const handleSubmitEdit = () => {
    if (editVal.trim() && onEditSubmit) {
      onEditSubmit(editVal.trim());
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className={cn(
        'group flex space-x-8 p-8 transition-all duration-300 select-text relative',
        message.role === 'assistant'
          ? 'bg-transparent'
          : 'bg-transparent'
      )}
    >
      {/* Role Indicator */}
      <div
        className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border transition-all duration-300',
          message.role === 'assistant'
            ? 'bg-secondary/40 text-primary border-border/40'
            : 'bg-primary/5 text-primary/40 border-primary/10'
        )}
      >
        {message.role === 'assistant' ? <GraduationCap className="h-5 w-5" /> : <div className="h-4 w-4 rounded-full bg-primary/20" />}
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] leading-none">
            {message.role === 'assistant' ? 'SmartPrep AI' : 'You'}
          </span>
          <span className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-wider leading-none opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isEditing ? (
          <div className="flex flex-col space-y-3 mt-1">
            <textarea
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              className="w-full bg-background border border-border/60 rounded-xl p-4 text-[14px] outline-none min-h-[120px] text-foreground font-sans leading-relaxed focus:ring-1 focus:ring-primary/20"
            />
            <div className="flex space-x-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg text-[11px] font-bold uppercase tracking-wider">Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSubmitEdit} className="rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-none">Update</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Thought Block */}
            {message.reasoning && (
              <div className="mb-6 rounded-xl border border-border/30 overflow-hidden bg-muted/20">
                <button 
                  onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors group/thought"
                >
                  <div className="flex items-center space-x-2.5">
                    <BrainCircuit className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/thought:text-primary/60 transition-colors" />
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] group-hover/thought:text-primary/60 transition-colors">
                      Thinking Process
                    </span>
                  </div>
                  {isThoughtExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/20" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/20" />}
                </button>
                
                <AnimatePresence>
                  {isThoughtExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-[13px] leading-relaxed text-muted-foreground/60 font-serif border-t border-border/10 select-text">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.reasoning}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className={cn(
              "prose max-w-none break-words",
              message.role === 'assistant' ? "font-serif text-[1.125rem]" : "font-sans text-[14px]"
            )}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const codeString = String(children).replace(/\n$/, '');
                    
                    if (!match) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 font-mono text-[0.9em] rounded" {...props}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="my-6 rounded-xl border border-border/30 bg-card overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/20 bg-muted/30">
                          <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest font-mono">
                            {language}
                          </span>
                          <div className="flex items-center space-x-4">
                            {(language === 'tsx' || language === 'jsx' || language === 'html' || language === 'javascript' || language === 'js') && (
                              <button
                                onClick={() => handlePreviewArtifact(codeString, language)}
                                className="flex items-center space-x-1.5 text-[9px] text-primary hover:text-primary/80 cursor-pointer font-black transition-colors uppercase tracking-widest"
                              >
                                <Play className="h-3 w-3" />
                                <span>Preview</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeString);
                                showToast('Copied', 'success', 'Code copied to clipboard.');
                              }}
                              className="flex items-center space-x-1.5 text-[9px] text-muted-foreground/40 hover:text-primary cursor-pointer font-black transition-colors uppercase tracking-widest"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                        <pre className="p-5 m-0 overflow-x-auto text-[13px] leading-relaxed font-mono bg-transparent">
                          <code className="text-foreground/90">{codeString}</code>
                        </pre>
                      </div>
                    );

                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-6 transition-all duration-300 mt-6 pt-4 border-t border-border/10">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 text-[9px] text-muted-foreground/40 hover:text-primary cursor-pointer font-black uppercase tracking-widest transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleFork}
              className="flex items-center space-x-1.5 text-[9px] text-muted-foreground/40 hover:text-primary cursor-pointer font-black uppercase tracking-widest transition-colors"
            >
              <GitFork className="h-3 w-3" />
              <span>Fork</span>
            </button>

            {message.role === 'assistant' && (
              <button
                onClick={handleSaveToNotes}
                className="flex items-center space-x-1.5 text-[9px] text-muted-foreground/40 hover:text-primary cursor-pointer font-black uppercase tracking-widest transition-colors"
              >
                <FileText className="h-3 w-3" />
                <span>Extract</span>
              </button>
            )}

            {message.role === 'user' && onEditSubmit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1.5 text-[9px] text-muted-foreground/40 hover:text-primary cursor-pointer font-black uppercase tracking-widest transition-colors"
              >
                <Edit className="h-3 w-3" />
                <span>Refine</span>
              </button>
            )}

            {message.role === 'assistant' && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center space-x-1.5 text-[9px] text-muted-foreground/40 hover:text-primary cursor-pointer font-black uppercase tracking-widest transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};


