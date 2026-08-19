import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle } from './Card';
import type { Insight } from '@/types';

const BORDER: Record<Insight['severity'], string> = {
  critical: 'border-l-negative',
  warning:  'border-l-warning',
  positive: 'border-l-positive',
  neutral:  'border-l-primary',
};

const BG: Record<Insight['severity'], string> = {
  critical: 'bg-negative/5',
  warning:  'bg-warning/5',
  positive: 'bg-positive/5',
  neutral:  'bg-primary/5',
};

const ICON_CLASS: Record<Insight['severity'], string> = {
  critical: 'text-negative',
  warning:  'text-warning',
  positive: 'text-positive',
  neutral:  'text-primary',
};

function SeverityIcon({ severity }: { severity: Insight['severity'] }) {
  const cls = `w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${ICON_CLASS[severity]}`;
  if (severity === 'critical') return <AlertTriangle className={cls} />;
  if (severity === 'warning')  return <AlertTriangle className={cls} />;
  if (severity === 'positive') return <CheckCircle2  className={cls} />;
  return <Info className={cls} />;
}

function MetricChip({ value }: { value: Insight['metric_value'] }) {
  if (value == null) return null;
  let label: string;
  if (typeof value === 'object') {
    // e.g. { overstock: 57, stockout: 23 }
    label = Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  } else {
    label = typeof value === 'number' && !Number.isInteger(value)
      ? value.toFixed(1)
      : String(Math.round(Number(value)));
  }
  return (
    <span className="flex-shrink-0 text-[10px] font-mono font-semibold text-muted bg-slate-100 border border-border rounded px-1.5 py-0.5 ml-2">
      {label}
    </span>
  );
}

interface InsightPanelProps {
  insights: Insight[];
  loading?: boolean;
  title?: string;
  /** Max rows to show; default 5 */
  cap?: number;
}

export function InsightPanel({ insights, loading, title = 'Insights', cap = 5 }: InsightPanelProps) {
  const visible = insights.slice(0, cap);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-[10px] text-muted bg-canvas px-2 py-0.5 rounded-full border border-border">
          Rule-based · No AI
        </span>
      </CardHeader>

      {loading ? (
        <ul className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="h-12 rounded-lg bg-slate-50 animate-pulse border-l-4 border-l-slate-200" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <p className="text-xs text-muted text-center py-6">
          No insights available for this period.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((ins, i) => (
            <li
              key={i}
              className={`flex items-start gap-2.5 p-3 rounded-lg border-l-4 ${BORDER[ins.severity]} ${BG[ins.severity]}`}
            >
              <SeverityIcon severity={ins.severity} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink leading-snug">{ins.message}</p>
                <p className="text-[10px] text-muted mt-0.5 capitalize">{ins.category}</p>
              </div>
              <MetricChip value={ins.metric_value} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
