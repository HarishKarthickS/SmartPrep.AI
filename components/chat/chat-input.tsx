'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Sparkles, CornerDownLeft, Paperclip, Loader2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/cn';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isStreaming: boolean;
  onAbort?: () => void;
  onFileAttach?: (file: File) => void;
  isProcessingFile?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isStreaming,
  onAbort,
  onFileAttach,
  isProcessingFile = false,
  placeholder = 'Write in the margin…'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileAttach) {
      onFileAttach(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-full">
      <div className={cn(
        "relative bg-card border border-border p-2 transition-all duration-300 paper-stack",
        "focus-within:border-primary/50"
      )}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming && !onAbort}
          className="w-full bg-transparent outline-none resize-none text-[15px] text-foreground placeholder:text-muted-foreground/50 min-h-[52px] py-4 px-5 max-h-[240px] leading-relaxed font-serif pr-14 custom-scrollbar"
        />

        <div className="h-11 flex items-center justify-between px-4 pb-1">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || isProcessingFile}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
              title="Attach document (PDF, TXT, MD)"
            >
              {isProcessingFile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center space-x-1.5 px-2 py-1 border border-border text-[10px] font-sans text-muted-foreground">
              <CornerDownLeft className="h-2.5 w-2.5" />
              <span className="leading-none">Send</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <AnimatePresence mode="wait">
              {isStreaming && onAbort ? (
                <motion.div
                  key="stop-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onAbort}
                    className="h-8 px-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-none"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span className="text-[10px] uppercase tracking-wider leading-none">Stop</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="send-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    variant="primary"
                    size="icon"
                    disabled={!value.trim() || isStreaming}
                    onClick={onSubmit}
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all shadow-none flex items-center justify-center",
                      value.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground/50 grayscale opacity-30"
                    )}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

