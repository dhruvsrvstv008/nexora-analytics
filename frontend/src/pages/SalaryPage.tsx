import { Lock } from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { useSalarySummary, useSalaryByDept, useAboveDeptAvg, useTopEarners, useSalaryBands, usePayrollShare, useSalaryInsights } from '@/hooks/useSalary';
import { InsightPanel } from '@/components/ui/InsightPanel';
import { useAuth } from '@/contexts/AuthContext';
import { formatINR, formatNumber, formatPct } from '@/lib/format';
import { DEPT_COLORS, cn } from '@/lib/utils';

const QUARTILE_COLORS = ['#E2E8F0','#94A3B8','#4F46E5','#3730A3'];
const QUARTILE_LABELS = ['Q1 — Bottom 25%','Q2 — Lower Mid','Q3 — Upper Mid','Q4 — Top 25%'];

function AccessDenied({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
      <Lock className="w-5 h-5 text-muted" />
      <p className="text-sm font-medium text-ink">{feature}</p>
      <p className="text-xs text-muted">Admin access required to view individual salary data.</p>
    </div>
  );
}

export default function SalaryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: summary, isPending: sumPending } = useSalarySummary();
  const { data: byDept,  isPending: deptPending } = useSalaryByDept();
  const { data: above,   isPending: abovePending, error: aboveErr } = useAboveDeptAvg();
  const { data: earners, isPending: earnPending,  error: earnErr  } = useTopEarners();
  const { data: bands,   isPending: bandPending  } = useSalaryBands();
  const { data: payroll, isPending: payPending   } = usePayrollShare();
  const { data: insights,isPending: insightsPending } = useSalaryInsights();

  // Bar chart: avg salary by dept
  const salaryBars = (byDept ?? []).map((d: any, i: number) => ({
    label: d.department_name.replace('Human Resources','HR').replace('Product Management','Prod Mgmt'),
    value: d.avg_salary,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  // Donut: payroll share
  const payrollDonut = (payroll ?? []).map((d: any, i: number) => ({
    department_id: d.department_id,
    department_name: d.department_name,
    revenue: d.monthly_payroll,
    revenue_share_pct: d.payroll_share_pct,
    profit: 0, total_orders: 0, avg_order_value: 0,
  }));

  // Bands: group by quartile
  const quartileGroups = (bands ?? []).reduce<Record<number, number>>((acc, b: any) => {
    acc[b.salary_quartile] = (acc[b.salary_quartile] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell title="Salary Analytics">
      {/* Insights */}
      <div className="mb-6">
        <InsightPanel title="Salary Insights" insights={insights ?? []} loading={insightsPending} cap={5} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {sumPending
          ? [...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-card border border-border shadow-card p-5 h-24 animate-pulse bg-slate-50" />)
          : [
            { label: 'Company Avg Salary',   value: formatINR(summary?.avg_salary ?? 0, false),          accent: '#4F46E5' },
            { label: 'Monthly Total Payroll', value: formatINR(summary?.total_monthly_payroll ?? 0),      accent: '#E11D48' },
            { label: 'Median Salary',         value: formatINR(summary?.median_salary ?? 0, false),       accent: '#16A34A' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-card border border-border shadow-card p-5">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">{k.label}</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: k.accent }}>{k.value}</p>
              <p className="text-xs text-muted mt-1">{k.label.includes('Payroll') ? 'Across all active employees' : 'Active employees'}</p>
            </div>
          ))
        }
      </div>

      {/* Avg salary by dept + payroll share */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          {deptPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader><CardTitle>Avg Salary by Department</CardTitle></CardHeader>
              <SimpleBarChart data={salaryBars} height={240} layout="vertical" formatValue={(v) => formatINR(v, false)} showValues />
            </Card>
          )}
        </div>
        <div>
          {payPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader><CardTitle>Payroll Share</CardTitle></CardHeader>
              <DonutChart data={payrollDonut} />
            </Card>
          )}
        </div>
      </div>

      {/* Salary quartile bands */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Salary Quartile Bands (NTILE 4)</CardTitle>
          <span className="text-[10px] text-muted bg-canvas px-2 py-0.5 rounded-full border border-border">Window function</span>
        </CardHeader>
        {bandPending
          ? <div className="h-16 bg-slate-50 rounded-lg animate-pulse" />
          : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[1,2,3,4].map(q => {
                const count = quartileGroups[q] ?? 0;
                const total = bands?.length ?? 1;
                return (
                  <div key={q} className="rounded-lg border border-border p-4 text-center">
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                      style={{ background: `${QUARTILE_COLORS[q-1]}22`, border: `2px solid ${QUARTILE_COLORS[q-1]}` }}>
                      <span className="text-sm font-bold" style={{ color: QUARTILE_COLORS[q-1] }}>Q{q}</span>
                    </div>
                    <p className="text-lg font-bold text-ink">{count}</p>
                    <p className="text-xs text-muted">{QUARTILE_LABELS[q-1]}</p>
                    <p className="text-xs font-semibold text-muted mt-1">{total > 0 ? ((count/total)*100).toFixed(0) : 0}%</p>
                  </div>
                );
              })}
            </div>
          )
        }
      </Card>

      {/* Above dept avg table (CTE version) */}
      <Card noPad className="mb-6">
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Above Department Average</CardTitle>
              <p className="text-xs text-muted mt-0.5">CTE version — computes dept avg once vs correlated subquery per row</p>
            </div>
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">SQL Showcase</span>
          </div>
        </div>
        {(aboveErr as any)?.response?.status === 403 || !isAdmin
          ? <AccessDenied feature="Above Department Average" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-canvas">
                    {['Employee','Department','Title','Level','Salary','Dept Avg','Premium'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {abovePending
                    ? [...Array(8)].map((_,i) => <tr key={i}>{[...Array(7)].map((_,j) => <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-20"/></td>)}</tr>)
                    : (above ?? []).map((e: any) => (
                      <tr key={e.employee_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-ink">{e.full_name}</td>
                        <td className="px-4 py-2.5 text-muted">{e.department_name}</td>
                        <td className="px-4 py-2.5 text-muted">{e.job_title}</td>
                        <td className="px-4 py-2.5 capitalize text-muted">{e.job_level}</td>
                        <td className="px-4 py-2.5 font-bold text-ink">{formatINR(e.salary, false)}</td>
                        <td className="px-4 py-2.5 text-muted">{formatINR(e.dept_avg_salary, false)}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-positive font-bold">+{formatINR(e.salary_premium, false)}</span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )
        }
      </Card>

      {/* Top earners */}
      <Card noPad>
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <CardTitle>Top 10 Earners — RANK() across all employees</CardTitle>
        </div>
        {(earnErr as any)?.response?.status === 403 || !isAdmin
          ? <AccessDenied feature="Top Earners" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-canvas">
                    {['Rank','Employee','Department','Title','Level','Salary','Hire Date'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {earnPending
                    ? [...Array(10)].map((_,i) => <tr key={i}>{[...Array(7)].map((_,j) => <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-20"/></td>)}</tr>)
                    : (earners ?? []).map((e: any, i: number) => (
                      <tr key={e.employee_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className={cn('text-base font-black', i < 3 ? 'text-warning' : 'text-muted/40')}>
                            {String(e.salary_rank).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {e.full_name?.charAt(0)}
                            </div>
                            <span className="font-medium text-ink">{e.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-muted">{e.department_name}</td>
                        <td className="px-4 py-2.5 text-muted">{e.job_title}</td>
                        <td className="px-4 py-2.5 capitalize text-muted">{e.job_level}</td>
                        <td className="px-4 py-2.5 font-bold text-ink">{formatINR(e.salary, false)}</td>
                        <td className="px-4 py-2.5 text-muted">{e.hire_date}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </AppShell>
  );
}
