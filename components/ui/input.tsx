import React from 'react';
import { cn } from '../../lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-muted-foreground flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full h-10 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary',
              {
                'pl-10': icon,
                'px-3': !icon,
                'border-destructive focus:border-destructive focus:ring-destructive': error,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-destructive mt-0.5 animate-pulse-slow">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
