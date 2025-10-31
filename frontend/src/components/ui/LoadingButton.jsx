import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoadingButton = React.forwardRef(
  ({ isLoading, children, className, variant, size, disabled, onClick, ...props }, ref) => {
    const handleClick = (e) => {
      if (isLoading || disabled) {
        e.preventDefault();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "relative transition-all duration-150 ease-out overflow-hidden",
          {
            'opacity-75 cursor-not-allowed': isLoading || disabled,
          },
          className
        )}
        disabled={isLoading || disabled}
        aria-busy={isLoading ? 'true' : 'false'}
        onClick={handleClick}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-current" />
          </div>
        )}
        <span
          className={cn("flex items-center justify-center whitespace-nowrap", {
            'opacity-0': isLoading,
          })}
        >
          {isLoading ? 'Loading...' : children}
        </span>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };