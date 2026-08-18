import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEPT_COLORS = [
  '#4F46E5', '#06B6D4', '#F59E0B', '#10B981',
  '#EF4444', '#8B5CF6', '#F97316', '#EC4899',
];

export const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: 'bg-positive/10', text: 'text-positive' },
  pending:   { label: 'Pending',   bg: 'bg-warning/10',  text: 'text-warning'  },
  cancelled: { label: 'Cancelled', bg: 'bg-muted/10',    text: 'text-muted'    },
  returned:  { label: 'Returned',  bg: 'bg-negative/10', text: 'text-negative' },
} as const;

export const SEVERITY_CONFIG = {
  critical: { icon: '🔴', bg: 'bg-negative/10', border: 'border-negative/30', text: 'text-negative' },
  warning:  { icon: '🟡', bg: 'bg-warning/10',  border: 'border-warning/30',  text: 'text-warning'  },
  positive: { icon: '🟢', bg: 'bg-positive/10', border: 'border-positive/30', text: 'text-positive' },
  neutral:  { icon: '🔵', bg: 'bg-primary/10',  border: 'border-primary/30',  text: 'text-primary'  },
} as const;
