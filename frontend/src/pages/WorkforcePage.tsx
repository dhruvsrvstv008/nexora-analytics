import { AppShell } from '@/layouts/AppShell';
import { FilterBar } from '@/components/ui/FilterBar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartSkeleton, KpiSkeleton } from '@/components/ui/Skeleton';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { HeadcountChart } from '@/components/charts/HeadcountChart';
import { useFilters } from '@/hooks/useFilters';
import { useWfSummary, useWfDistribution, useHeadcountTrend, useSalaryByDept, useTenure } from '@/hooks/useWorkforce';
import { formatINR, formatNumber, formatPct } from '@/lib/format';
import { DEPT_COLORS } from '@/lib/utils';

const TENURE_COLORS: Record<string, string> = {
  '0–1 yr': '#F59E0B', '1–3 yr': '#4F46E5', '3–5 yr': '#16A34A', '5+ yr': '#06B6D4',
};

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink" style={accent ? { color: accent } : {}}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function WorkforcePage() {
  const { filters, setFilter, clearFilters, hasFilters } = useFilters();
  const { data: summary,   isPending: sumPending }  = useWfSummary(filters);
  const { data: byDept,    isPending: deptPending }  = useWfDistribution({ ...filters, dim: 'department' });
  const { data: byLevel,   isPending: lvlPending }   = useWfDistribution({ ...filters, dim: 'level' });
  const { data: hcTrend,   isPending: hcPending }    = useHeadcountTrend(filters);
  const { data: salaryDept,isPending: salPending }   = useSalaryByDept();
  const { data: tenure,    isPending: tenPending }   = useTenure(filters);

  // Tenure bucket counts for bar chart
  const tenureBuckets = Object.entries(
    (tenure ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.tenure_bucket] = (acc[r.tenure_bucket] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value, color: TENURE_COLORS[label] }));

  // By dept bar chart data
  const deptBars = (byDept ?? []).map((d, i) => ({
    label: d.dimension_label.replace('Human Resources','HR').replace('Product Management','Product Mgmt'),
    value: d.headcount,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  // By level for donut (reuse DonutChart with shaped data)
  const levelDonutData = (byLevel ?? []).map(d => ({
    department_id: 0,
    department_name: d.dimension_label,
    revenue: d.headcount,
    revenue_share_pct: d.headcount_share_pct,
    profit: 0,
    total_orders: 0,
    avg_order_value: 0,
  }));

  return (
    <AppShell title="Workforce Analytics">
      <div className="mb-6">
        <FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} hasFilters={hasFilters}
          show={{ year: false, month: false, dept: true }} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {sumPending ? [...Array(5)].map((_,i) => <KpiSkeleton key={i} />) : (<>
          <StatCard label="Active Employees" value={formatNumber(summary?.active_count ?? 0)} accent="#4F46E5" />
          <StatCard label="Total Exits"      value={formatNumber(summary?.exited_count ?? 0)} accent="#E11D48" />
          <StatCard label="New Hires YTD"    value={formatNumber(summary?.new_hires_ytd ?? 0)} accent="#16A34A" />
          <StatCard label="Attrition Rate"   value={formatPct(summary?.attrition_rate_pct, false)} sub="This year" accent="#F59E0B" />
          <StatCard label="Avg Tenure"       value={`${summary?.avg_tenure_months?.toFixed(0) ?? '—'} mo`} sub="Active employees" accent="#06B6D4" />
        </>)}
      </div>

      {/* Headcount by dept + by level */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          {deptPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader><CardTitle>Headcount by Department</CardTitle></CardHeader>
              <SimpleBarChart data={deptBars} height={240} layout="vertical" formatValue={formatNumber} showValues />
            </Card>
          )}
        </div>
        <div>
          {lvlPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader><CardTitle>By Job Level</CardTitle></CardHeader>
              <DonutChart data={levelDonutData} />
            </Card>
          )}
        </div>
      </div>

      {/* Headcount trend + tenure buckets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          {hcPending ? <ChartSkeleton height={220} /> : (
            <Card>
              <CardHeader>
                <CardTitle>Headcount Growth</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-positive inline-block" />Hires</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-negative inline-block" />Exits</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Headcount</span>
                </div>
              </CardHeader>
              <HeadcountChart data={hcTrend ?? []} height={220} />
            </Card>
          )}
        </div>
        <div>
          {tenPending ? <ChartSkeleton height={220} /> : (
            <Card>
              <CardHeader><CardTitle>Tenure Buckets</CardTitle></CardHeader>
              <SimpleBarChart
                data={['0–1 yr','1–3 yr','3–5 yr','5+ yr']
                  .map(b => tenureBuckets.find(t => t.label === b) ?? { label: b, value: 0, color: TENURE_COLORS[b] })}
                height={220} formatValue={formatNumber} showValues
              />
            </Card>
          )}
        </div>
      </div>

      {/* Salary by department */}
      <Card noPad>
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <CardTitle>Salary by Department</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {['Department','Headcount','Avg Salary','Min','Max','Monthly Payroll','Payroll Share'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {salPending
                ? [...Array(8)].map((_,i) => <tr key={i}>{[...Array(7)].map((_,j) => <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-20"/></td>)}</tr>)
                : (salaryDept ?? []).map((d: any, i: number) => (
                  <tr key={d.department_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-ink">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                        {d.department_name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{d.headcount}</td>
                    <td className="px-4 py-2.5 font-semibold text-ink">{formatINR(d.avg_salary, false)}</td>
                    <td className="px-4 py-2.5 text-muted">{formatINR(d.min_salary, false)}</td>
                    <td className="px-4 py-2.5 text-muted">{formatINR(d.max_salary, false)}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{formatINR(d.monthly_payroll)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-canvas rounded-full h-1.5 min-w-[60px]">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${d.payroll_share_pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-primary w-10 text-right">{d.payroll_share_pct?.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
