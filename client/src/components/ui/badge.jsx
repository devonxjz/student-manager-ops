import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-indigo-50 text-indigo-700',
        secondary: 'border-transparent bg-slate-100 text-slate-700',
        success: 'border-transparent bg-emerald-50 text-emerald-700',
        warning: 'border-transparent bg-amber-50 text-amber-700',
        destructive: 'border-transparent bg-rose-50 text-rose-700',
        outline: 'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
