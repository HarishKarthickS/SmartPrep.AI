import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={cn(
              'w-full h-10 bg-card border border-border rounded-md px-3 text-sm text-foreground appearance-none transition-all duration-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer pr-10',
              {
                'border-destructive focus:border-destructive focus:ring-destructive': error,
              },
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-card text-foreground">
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
            <ChevronDown className="h-4 w-4" />
          </div>
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

Select.displayName = 'Select';
export default Select;
