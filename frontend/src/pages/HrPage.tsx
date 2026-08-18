import { AppShell } from '@/layouts/AppShell';
import { FilterBar } from '@/components/ui/FilterBar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { HeadcountChart } from '@/components/charts/HeadcountChart';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { useFilters } from '@/hooks/useFilters';
import { useHrSummary, useHiringTrend, useAttrition } from '@/hooks/useHr';
import { formatNumber, formatPct } from '@/lib/format';
import { DEPT_COLORS, cn } from '@/lib/utils';

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-bold" style={{ color: accent ?? '#0F172A' }}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function HrPage() {
  const { filters, setFilter, clearFilters, hasFilters } = useFilters();
  const { data: summary,  isPending: sumPending }  = useHrSummary();
  const { data: hiring,   isPending: hirePending }  = useHiringTrend(filters);
  const { data: attrition,isPending: attrPending }  = useAttrition();

  const attritionBars = (attrition ?? [])
    .sort((a: any, b: any) => b.attrition_rate_pct - a.attrition_rate_pct)
    .map((d: any, i: number) => ({
      label: d.department_name.replace('Human Resources','HR').replace('Product Management','Prod Mgmt').replace('Customer Support','Cust Support'),
      value: Number(d.attrition_rate_pct ?? 0),
      color: Number(d.attrition_rate_pct ?? 0) >= 20 ? '#E11D48' : Number(d.attrition_rate_pct ?? 0) >= 10 ? '#F59E0B' : '#16A34A',
    }));

  return (
    <AppShell title="HR Analytics">
      <div className="mb-6">
        <FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} hasFilters={hasFilters}
          show={{ year: false, month: false, dept: true }} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {sumPending
          ? [...Array(5)].map((_,i) => <div key={i} className="bg-white rounded-card border border-border shadow-card p-5 h-24 animate-pulse bg-slate-50" />)
          : [
            { label: 'Active Employees', value: formatNumber(summary?.active_count ?? 0),    accent: '#4F46E5' },
            { label: 'New Hires YTD',    value: formatNumber(summary?.new_hires_ytd ?? 0),   accent: '#16A34A' },
            { label: 'Exits YTD',        value: formatNumber(summary?.exits_ytd ?? 0),        accent: '#E11D48' },
            { label: 'Attrition Rate',   value: formatPct(summary?.attrition_rate_pct, false),accent: (summary?.attrition_rate_pct ?? 0) >= 15 ? '#E11D48' : '#F59E0B' },
            { label: 'Avg Tenure',       value: `${summary?.avg_tenure_months?.toFixed(0) ?? '—'} mo`, sub: 'Active employees' },
          ].map(k => <StatCard key={k.label} {...k} />)
        }
      </div>

      {/* Hiring trend + attrition by dept */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          {hirePending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader>
                <CardTitle>Hiring Trend — New Hires &amp; Exits per Month</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-positive inline-block" />New Hires</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-negative inline-block" />Exits</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Headcount</span>
                </div>
              </CardHeader>
              <HeadcountChart data={hiring ?? []} height={240} />
            </Card>
          )}
        </div>
        <div>
          {attrPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader><CardTitle>Attrition Rate by Dept</CardTitle></CardHeader>
              <SimpleBarChart data={attritionBars} height={240} layout="vertical" formatValue={(v) => `${v.toFixed(1)}%`} showValues />
            </Card>
          )}
        </div>
      </div>

      {/* Attrition details table */}
      <Card noPad>
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <CardTitle>Attrition by Department — exits, resigned vs terminated, avg tenure at exit</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {['Department','Active','Total Exits','Resigned','Terminated','Attrition Rate','Avg Tenure at Exit'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attrPending
                ? [...Array(8)].map((_,i) => <tr key={i}>{[...Array(7)].map((_,j) => <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-16"/></td>)}</tr>)
                : (attrition ?? []).map((d: any, i: number) => {
                  const rate = Number(d.attrition_rate_pct ?? 0);
                  return (
                    <tr key={d.department_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                          <span className="font-medium text-ink">{d.department_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-ink font-semibold">{d.active_headcount}</td>
                      <td className="px-4 py-2.5 text-muted">{d.exit_count}</td>
                      <td className="px-4 py-2.5 text-warning">{d.resigned_count}</td>
                      <td className="px-4 py-2.5 text-negative">{d.terminated_count}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-canvas rounded-full h-1.5 min-w-[48px]">
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${Math.min(rate * 3, 100)}%`, background: rate >= 20 ? '#E11D48' : rate >= 10 ? '#F59E0B' : '#16A34A' }} />
                          </div>
                          <span className={cn('text-xs font-semibold w-10 text-right', rate >= 20 ? 'text-negative' : rate >= 10 ? 'text-warning' : 'text-positive')}>
                            {rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        {d.avg_tenure_at_exit_months ? `${Number(d.avg_tenure_at_exit_months).toFixed(0)} mo` : '—'}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
