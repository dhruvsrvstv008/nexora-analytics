import { cn } from '@/lib/utils';

interface TabItem { key: string; label: string; count?: number; }

interface Props {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: Props) {
  return (
    <div className={cn('flex items-center gap-1 bg-canvas rounded-control p-1 border border-border', className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all',
            active === t.key
              ? 'bg-white text-primary shadow-sm border border-border'
              : 'text-muted hover:text-ink',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
              active === t.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-muted',
            )}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
