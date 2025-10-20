import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 group relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_4px_10px_hsla(var(--primary),0.3),_0_1px_2px_hsla(var(--primary),0.2)] hover:bg-[hsl(var(--primary),90%)] hover:shadow-[0_6px_15px_hsla(var(--primary),0.4),_0_2px_3px_hsla(var(--primary),0.3)] active:scale-[0.97] active:shadow-[0_2px_5px_hsla(var(--primary),0.2)]',
        destructive:
          'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] shadow-[0_4px_10px_hsla(var(--destructive),0.3),_0_1px_2px_hsla(var(--destructive),0.2)] hover:bg-[hsl(var(--destructive),90%)] hover:shadow-[0_6px_15px_hsla(var(--destructive),0.4),_0_2px_3px_hsla(var(--destructive),0.3)] active:scale-[0.97] active:shadow-[0_2px_5px_hsla(var(--destructive),0.2)]',
        outline:
          'border border-[hsl(var(--input))] bg-transparent text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent),15%)] hover:text-[hsl(var(--accent))] hover:border-[hsl(var(--accent),0.7)] shadow-sm active:scale-[0.98] active:bg-[hsl(var(--accent),25%)]',
        secondary:
          'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] shadow-[0_4px_10px_hsla(var(--secondary),0.3),_0_1px_2px_hsla(var(--secondary),0.2)] hover:bg-[hsl(var(--secondary),90%)] hover:shadow-[0_6px_15px_hsla(var(--secondary),0.4),_0_2px_3px_hsla(var(--secondary),0.3)] active:scale-[0.97] active:shadow-[0_2px_5px_hsla(var(--secondary),0.2)]',
        ghost: 'hover:bg-[hsl(var(--muted),50%)] hover:text-[hsl(var(--accent-foreground))] active:scale-[0.98]',
        link: 'text-[hsl(var(--primary))] underline-offset-4 hover:underline hover:text-[hsl(var(--accent))] active:scale-[0.98]',
        aiFutureGlow:
          'bg-gradient-to-r from-boogasi-cyan to-boogasi-purple text-primary-foreground shadow-lg shadow-boogasi-purple/30 hover:opacity-90 transform hover:scale-105 active:scale-100 transition-all duration-300',
        neonGreen: 
          'bg-boogasi-green text-black font-bold border-2 border-boogasi-green shadow-[0_0_10px_hsl(var(--boogasi-green-val)),_0_0_20px_hsl(var(--boogasi-green-val),0.5)] hover:bg-white hover:text-boogasi-green hover:shadow-[0_0_15px_hsl(var(--boogasi-green-val)),_0_0_30px_hsl(var(--boogasi-green-val),0.7)] active:scale-95'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {children}
    </Comp>
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };