import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from '@/components/charts/Sparkline';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { formatPct } from '@/lib/format';
import type { KpiValue, TrendPoint } from '@/types';

interface Props {
  label: string;
  kpi?: KpiValue;
  format: (v: number) => string;
  sparkData?: TrendPoint[];
  sparkKey?: 'revenue' | 'profit';
  loading?: boolean;
  accent?: string;
}

export function KpiCard({ label, kpi, format, sparkData, sparkKey = 'revenue', loading, accent = '#4F46E5' }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-card border border-border shadow-card p-5 flex flex-col gap-3">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  const direction = kpi?.direction ?? 'neutral';
  const isUp   = direction === 'up';
  const isDown = direction === 'down';

  const sparkValues = sparkData?.slice(-12).map((d) => ({ value: Number(d[sparkKey]) }));

  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
        {sparkValues?.length ? (
          <Sparkline data={sparkValues} color={accent} height={36} />
        ) : null}
      </div>

      <p className="mt-2 text-2xl font-bold text-ink tracking-tight">
        {kpi ? format(kpi.value) : '—'}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        {isUp   && <TrendingUp   className="w-3.5 h-3.5 text-positive" />}
        {isDown && <TrendingDown className="w-3.5 h-3.5 text-negative" />}
        {!isUp && !isDown && <Minus className="w-3.5 h-3.5 text-muted" />}

        <span className={cn(
          'text-xs font-semibold',
          isUp   ? 'text-positive' : isDown ? 'text-negative' : 'text-muted',
        )}>
          {formatPct(kpi?.change_pct)}
        </span>
        <span className="text-xs text-muted">vs last year</span>
      </div>
    </div>
  );
}
