import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-slate-100 rounded-lg', className)} />
  );
}

export function KpiSkeleton() {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5 flex flex-col gap-3">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <Skeleton className="h-4 w-40 mb-6" />
      <div className="animate-pulse bg-slate-100 rounded-lg w-full" style={{ height }} />
    </div>
  );
}
