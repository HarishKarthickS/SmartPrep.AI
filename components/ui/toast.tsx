import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastStore, ToastMessage } from '../../stores/toast-store';
import { cn } from '../../lib/utils/cn';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    info: <Info className="h-5 w-5 text-primary" />,
  };

  return (
    <div
      className={cn(
        'p-4 paper-stack flex items-start space-x-3 pointer-events-auto transform transition-all translate-y-0 opacity-100 animate-in slide-in-from-bottom-5 duration-200',
        {
          'border-l-4 border-l-emerald-500': toast.type === 'success',
          'border-l-4 border-l-destructive': toast.type === 'error',
          'border-l-4 border-l-primary': toast.type === 'info',
        }
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-serif font-semibold text-foreground leading-snug">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-normal">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-0.5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ToastContainer;
