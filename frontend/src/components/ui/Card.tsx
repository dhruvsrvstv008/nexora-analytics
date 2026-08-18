import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  noPad?: boolean;
}

export function Card({ children, className, noPad }: CardProps) {
  return (
    <div className={cn('bg-white rounded-card border border-border shadow-card', !noPad && 'p-5', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold text-ink', className)}>{children}</h3>
  );
}
