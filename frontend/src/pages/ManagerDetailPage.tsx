import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFilters } from '@/hooks/useFilters';
import { useManagerOverview, useManagerTeam } from '@/hooks/useManagers';
import { formatINR, formatNumber, formatPct } from '@/lib/format';
import { cn } from '@/lib/utils';

const TIER = {
  Exceeded: 'bg-positive/10 text-positive border border-positive/20',
  Met:      'bg-primary/10 text-primary border border-primary/20',
  Missed:   'bg-negative/10 text-negative border border-negative/20',
};

export default function ManagerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const managerId = Number(id);
  const { filters } = useFilters();
  const { data: overview, isPending: ovPending } = useManagerOverview(managerId, filters);
  const { data: team,     isPending: tmPending }  = useManagerTeam(managerId, filters);

  return (
    <AppShell title={overview?.manager_name ?? 'Manager Detail'}>
      {/* Back nav */}
      <Link to="/managers" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to leaderboard
      </Link>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {ovPending
          ? [...Array(5)].map((_,i) => <div key={i} className="bg-white rounded-card border border-border shadow-card p-5 h-24 animate-pulse bg-slate-50" />)
          : [
            { label: 'Department',       value: overview?.department_name ?? '—', isText: true },
            { label: 'Team Size',        value: formatNumber(overview?.team_size ?? 0) },
            { label: 'Team Revenue',     value: formatINR(overview?.team_revenue ?? 0), accent: '#4F46E5' },
            { label: 'Team Target',      value: formatINR(overview?.team_target ?? 0) },
            { label: 'Achievement',      value: `${overview?.team_achievement_pct?.toFixed(1) ?? '—'}%`,
              accent: (overview?.team_achievement_pct ?? 0) >= 100 ? '#16A34A' : '#E11D48' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-card border border-border shadow-card p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">{k.label}</p>
              <p className="mt-2 text-xl font-bold" style={{ color: k.accent ?? '#0F172A' }}>{k.value}</p>
            </div>
          ))
        }
      </div>

      {/* Team performance table */}
      <Card noPad>
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <CardTitle>Team Performance — {overview?.manager_name}&apos;s reports vs their individual targets</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {['Employee','Department','Period','Orders','Actual','Target','Achievement','Tier','Rank'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tmPending
                ? [...Array(10)].map((_,i) => (
                    <tr key={i}>{[...Array(9)].map((_,j) => (
                      <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-16"/></td>
                    ))}</tr>
                  ))
                : (team ?? []).map((row: any, i: number) => {
                  const pct = row.achievement_pct ?? 0;
                  return (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-ink">{row.full_name}</td>
                      <td className="px-4 py-2.5 text-muted">{row.department_name}</td>
                      <td className="px-4 py-2.5 text-muted">{row.period_month?.substring(0, 7)}</td>
                      <td className="px-4 py-2.5 text-muted">{row.order_count}</td>
                      <td className="px-4 py-2.5 font-semibold text-ink">{formatINR(row.actual_revenue)}</td>
                      <td className="px-4 py-2.5 text-muted">{formatINR(row.target_amount)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {pct >= 100 ? <TrendingUp className="w-3 h-3 text-positive" />
                            : pct >= 85 ? <Minus className="w-3 h-3 text-warning" />
                            : <TrendingDown className="w-3 h-3 text-negative" />}
                          <span className={cn('font-semibold', pct >= 100 ? 'text-positive' : pct >= 85 ? 'text-warning' : 'text-negative')}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold', TIER[row.performance_tier as keyof typeof TIER])}>
                          {row.performance_tier}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted font-bold">{row.rank_in_period}</td>
                    </tr>
                  );
                })
              }
              {!tmPending && !team?.length && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted text-xs">No target data for this manager.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
