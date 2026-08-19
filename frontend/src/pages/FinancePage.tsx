import { AppShell } from '@/layouts/AppShell';
import { FilterBar } from '@/components/ui/FilterBar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { ComboChart } from '@/components/charts/ComboChart';
import { useFilters } from '@/hooks/useFilters';
import { useFinanceSummary, useFinanceTrend, useFinanceDeptCosts, useFinanceDeptPnl, useFinanceInsights } from '@/hooks/useFinance';
import { InsightPanel } from '@/components/ui/InsightPanel';
import { formatINR, formatPct } from '@/lib/format';
import { DEPT_COLORS, cn } from '@/lib/utils';

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-xl font-bold" style={{ color: accent ?? '#0F172A' }}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function FinancePage() {
  const { filters, setFilter, clearFilters, hasFilters } = useFilters();
  const { data: summary, isPending: sumPending }   = useFinanceSummary(filters);
  const { data: trend,   isPending: trendPending }  = useFinanceTrend(filters);
  const { data: costs,   isPending: costPending }   = useFinanceDeptCosts(filters);
  const { data: pnl,     isPending: pnlPending }    = useFinanceDeptPnl(filters);
  const { data: insights,isPending: insightsPending } = useFinanceInsights(filters);

  return (
    <AppShell title="Finance Analytics">
      <div className="mb-6">
        <FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} hasFilters={hasFilters}
          show={{ year: true, month: false, dept: false }} />
      </div>

      {/* Insights */}
      <div className="mb-6">
        <InsightPanel title="Finance Insights" insights={insights ?? []} loading={insightsPending} cap={5} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {sumPending
          ? [...Array(5)].map((_,i) => <div key={i} className="bg-white rounded-card border border-border shadow-card p-5 h-24 animate-pulse bg-slate-50" />)
          : [
            { label: 'Total Revenue',    value: formatINR(summary?.revenue ?? 0),      accent: '#4F46E5' },
            { label: 'Total Expenses',   value: formatINR(summary?.total_expenses ?? 0),accent: '#E11D48' },
            { label: 'Gross Profit',     value: formatINR(summary?.gross_profit ?? 0),  accent: '#16A34A' },
            { label: 'Net Profit',       value: formatINR(summary?.net_profit ?? 0),    accent: (summary?.net_profit ?? 0) >= 0 ? '#16A34A' : '#E11D48' },
            { label: 'Gross Margin',     value: formatPct(summary?.gross_margin_pct, false), sub: 'On completed sales' },
          ].map(k => <StatCard key={k.label} {...k} />)
        }
      </div>

      {/* Revenue vs Expenses combo chart */}
      <div className="mb-6">
        {trendPending ? <ChartSkeleton height={260} /> : (
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses vs Net Profit</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-negative inline-block" />Expenses</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-positive inline-block" />Net Profit</span>
              </div>
            </CardHeader>
            <ComboChart data={trend ?? []} height={260} />
          </Card>
        )}
      </div>

      {/* Dept costs + Dept P&L side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Dept cost breakdown */}
        <Card noPad>
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <CardTitle>Department Costs Breakdown</CardTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-canvas">
                  {['Department','Payroll','Operations','Marketing','Infra','Total','Share'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {costPending
                  ? [...Array(8)].map((_,i) => <tr key={i}>{[...Array(7)].map((_,j) => <td key={j} className="px-3 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-14"/></td>)}</tr>)
                  : (costs ?? []).map((d: any, i: number) => (
                    <tr key={d.department_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-ink">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                          {d.department_name.replace('Human Resources','HR').replace('Product Management','Prod')}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted">{formatINR(d.payroll)}</td>
                      <td className="px-3 py-2.5 text-muted">{formatINR(d.operations)}</td>
                      <td className="px-3 py-2.5 text-muted">{formatINR(d.marketing)}</td>
                      <td className="px-3 py-2.5 text-muted">{formatINR(d.infrastructure)}</td>
                      <td className="px-3 py-2.5 font-semibold text-ink">{formatINR(d.total_expenses)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 bg-canvas rounded-full h-1.5 min-w-[40px]">
                            <div className="h-1.5 rounded-full bg-negative" style={{ width: `${Math.min(d.expense_share_pct, 100)}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-muted w-8 text-right">{d.expense_share_pct?.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Card>

        {/* Department P&L — FULL OUTER JOIN showcase */}
        <Card noPad>
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Department P&amp;L</CardTitle>
                <p className="text-xs text-muted mt-0.5">Revenue CTE FULL OUTER JOIN Expenses CTE</p>
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">SQL Showcase</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-canvas">
                  {['Department','Revenue','Gross Profit','Expenses','Net Profit','Margin'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pnlPending
                  ? [...Array(8)].map((_,i) => <tr key={i}>{[...Array(6)].map((_,j) => <td key={j} className="px-3 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-14"/></td>)}</tr>)
                  : (pnl ?? []).map((d: any, i: number) => {
                    const positive = Number(d.net_profit ?? 0) >= 0;
                    return (
                      <tr key={d.department_id ?? i} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-ink">
                          {d.department_name.replace('Human Resources','HR').replace('Product Management','Prod')}
                        </td>
                        <td className="px-3 py-2.5 text-ink">{formatINR(d.revenue)}</td>
                        <td className="px-3 py-2.5 text-positive">{formatINR(d.gross_profit)}</td>
                        <td className="px-3 py-2.5 text-negative">{formatINR(d.total_expenses)}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn('font-bold', positive ? 'text-positive' : 'text-negative')}>
                            {positive ? '+' : ''}{formatINR(d.net_profit)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={cn('text-xs font-semibold', (d.gross_margin_pct ?? 0) > 0 ? 'text-positive' : 'text-muted')}>
                            {d.gross_margin_pct?.toFixed(1) ?? '—'}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
