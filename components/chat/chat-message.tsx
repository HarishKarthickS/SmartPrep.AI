'use client';

import React, { useState } from 'react';
import { Copy, Check, FileText, Edit, RotateCcw, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { useNotesStore } from '../../stores/notes-store';
import { useToastStore } from '../../stores/toast-store';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/cn';

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
  const { addNote } = useNotesStore();
  const { showToast } = useToastStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied', 'success', 'Message content copied to clipboard.');
  };

  const handleSaveToNotes = () => {
    const defaultTitle = message.content.slice(0, 30).trim() + '...';
    const noteId = addNote({
      title: `AI Note: ${defaultTitle}`,
      content: message.content,
      tags: ['chat-export'],
      chatId: undefined, // Option to link
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
    <div
      className={cn(
        'group flex space-x-4 p-5 rounded-lg border transition-all duration-200 select-text',
        message.role === 'assistant'
          ? 'bg-card border-border shadow-sm shadow-black/5'
          : 'bg-muted/30 border-transparent'
      )}
    >
      {/* Icon/Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 border',
          message.role === 'assistant'
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'bg-secondary text-secondary-foreground border-border'
        )}
      >
        {message.role === 'assistant' ? <Sparkles className="h-4 w-4" /> : 'U'}
      </div>

      {/* Content Canvas */}
      <div className="flex-1 min-w-0 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground tracking-wide">
            {message.role === 'assistant' ? 'SmartPrep AI' : 'You'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Text Area / Editing */}
        {isEditing ? (
          <div className="flex flex-col space-y-2 mt-1">
            <textarea
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              className="w-full bg-background border border-border rounded-md p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] text-foreground font-sans"
            />
            <div className="flex space-x-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmitEdit}>
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none break-words text-sm text-foreground/90 font-normal">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Beautiful Custom Code block renderer with languages headers and copy buttons
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');
                  
                  if (!match) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="my-4 rounded-md border border-border bg-card/60 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                          {language}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(codeString);
                            showToast('Copied', 'success', 'Code copied to clipboard.');
                          }}
                          className="flex items-center space-x-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-semibold transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy code</span>
                        </button>
                      </div>
                      <pre className="p-4 m-0 overflow-x-auto text-xs leading-relaxed font-mono">
                        <code className="text-foreground">{codeString}</code>
                      </pre>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Action Panel under the message bubble */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-3 transition-opacity duration-200 mt-2.5">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-semibold"
              title="Copy response"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {message.role === 'assistant' && (
              <button
                onClick={handleSaveToNotes}
                className="flex items-center space-x-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-semibold"
                title="Save output to study notes"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Save to Notes</span>
              </button>
            )}

            {message.role === 'user' && onEditSubmit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-semibold"
                title="Edit message"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}

            {message.role === 'assistant' && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center space-x-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-semibold"
                title="Regenerate this output"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
