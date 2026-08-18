import { cn } from '@/lib/utils';

type Variant = 'completed' | 'pending' | 'cancelled' | 'returned' | 'low_stock' | 'out_of_stock' | 'overstock';

const VARIANTS: Record<Variant, string> = {
  completed:   'bg-positive/10 text-positive',
  pending:     'bg-warning/10 text-warning',
  cancelled:   'bg-slate-100 text-slate-500',
  returned:    'bg-negative/10 text-negative',
  low_stock:   'bg-warning/10 text-warning',
  out_of_stock:'bg-negative/10 text-negative',
  overstock:   'bg-blue-50 text-blue-600',
};

const LABELS: Record<Variant, string> = {
  completed: 'Completed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  returned: 'Returned',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  overstock: 'Overstock',
};

export function Badge({ variant, className }: { variant: Variant; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', VARIANTS[variant], className)}>
      {LABELS[variant]}
    </span>
  );
}
