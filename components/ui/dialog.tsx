import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils/cn';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className
}) => {
  // Prevent background scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative w-full max-w-lg paper-stack z-10 flex flex-col max-h-[85vh] transform transition-all scale-100 opacity-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h3 className="text-base font-serif font-bold text-foreground">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full text-muted-foreground transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 text-[13px] text-muted-foreground leading-relaxed font-medium">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end space-x-2 p-6 border-t border-border/50 bg-secondary/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dialog;
