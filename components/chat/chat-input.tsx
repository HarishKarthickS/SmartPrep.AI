'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isStreaming: boolean;
  onAbort?: () => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isStreaming,
  onAbort,
  placeholder = 'Ask anything or paste study topics...'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand height
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

  return (
    <div className="relative border border-border bg-card rounded-lg shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all p-2 flex flex-col space-y-2 select-none">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isStreaming && !onAbort}
        className="w-full bg-transparent outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground min-h-[44px] py-2 px-3.5 max-h-[240px] leading-relaxed font-sans pr-16"
      />

      <div className="flex items-center justify-between border-t border-border/40 pt-2 px-1 text-xs text-muted-foreground select-none">
        <div className="flex items-center space-x-1.5 opacity-80 pl-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Character counters if needed, or simple status indicators */}
          {value.length > 0 && (
            <span className="text-[10px] pr-2 opacity-60">
              {value.length} characters
            </span>
          )}

          {isStreaming && onAbort ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onAbort}
              className="h-8 px-3 text-xs font-semibold flex items-center space-x-1.5"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="icon"
              disabled={!value.trim() || isStreaming}
              onClick={onSubmit}
              className="h-8 w-8 rounded-md"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
