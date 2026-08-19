import { AppShell } from '@/layouts/AppShell';
import { FilterBar } from '@/components/ui/FilterBar';
import { Tabs } from '@/components/ui/Tabs';
import { KpiCard } from '@/components/kpi/KpiCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { TargetChart } from '@/components/charts/TargetChart';
import { useFilters } from '@/hooks/useFilters';
import { useSalesSummary, useSalesTrend, useSalesByDim, useSalesTargets, useSalesOrders, useSalesInsights } from '@/hooks/useSales';
import { InsightPanel } from '@/components/ui/InsightPanel';
import { formatINR, formatNumber, formatDate, formatPct } from '@/lib/format';
import { cn } from '@/lib/utils';

const DIM_TABS = [
  { key: 'department', label: 'Department' },
  { key: 'employee',   label: 'Employee'   },
  { key: 'manager',    label: 'Manager'    },
  { key: 'product',    label: 'Product'    },
  { key: 'category',   label: 'Category'   },
  { key: 'region',     label: 'Region'     },
];

const TIER_STYLE = {
  Exceeded: 'bg-positive/10 text-positive',
  Met:      'bg-primary/10 text-primary',
  Missed:   'bg-negative/10 text-negative',
};

function DimTable({ data, dim }: { data: any[]; dim: string }) {
  const nameKey  = dim === 'employee' ? 'full_name' : dim === 'manager' ? 'manager_name' : dim === 'product' ? 'product_name' : `${dim}_name`;
  const idKey    = dim === 'manager' ? 'manager_id' : `${dim}_id`;

  if (!data.length) return <p className="text-xs text-muted text-center py-8">No data for this selection.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-canvas">
            <th className="text-left px-4 py-2.5 text-muted font-semibold">#</th>
            <th className="text-left px-4 py-2.5 text-muted font-semibold capitalize">{dim}</th>
            <th className="text-right px-4 py-2.5 text-muted font-semibold">Revenue</th>
            <th className="text-right px-4 py-2.5 text-muted font-semibold">Profit</th>
            <th className="text-right px-4 py-2.5 text-muted font-semibold">Orders</th>
            <th className="text-right px-4 py-2.5 text-muted font-semibold">Avg Order</th>
            {data[0]?.revenue_share_pct != null && <th className="text-right px-4 py-2.5 text-muted font-semibold">Share</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row[idKey] ?? i} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
              <td className="px-4 py-2.5 text-muted font-bold">{String(i + 1).padStart(2, '0')}</td>
              <td className="px-4 py-2.5 font-medium text-ink">{row[nameKey] ?? '—'}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-ink">{formatINR(row.revenue)}</td>
              <td className="px-4 py-2.5 text-right text-positive font-medium">{formatINR(row.profit)}</td>
              <td className="px-4 py-2.5 text-right text-muted">{formatNumber(row.total_orders)}</td>
              <td className="px-4 py-2.5 text-right text-muted">{formatINR(row.avg_order_value)}</td>
              {row.revenue_share_pct != null && (
                <td className="px-4 py-2.5 text-right">
                  <span className="text-xs font-semibold text-primary">{row.revenue_share_pct?.toFixed(1)}%</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SalesPage() {
  const { filters, setFilter, clearFilters, hasFilters } = useFilters();
  const { data: summary, isPending: sumPending }  = useSalesSummary(filters);
  const { data: trend,   isPending: trendPending } = useSalesTrend(filters);
  const { data: dimData, isPending: dimPending }   = useSalesByDim(filters);
  const { data: targets, isPending: tgtPending }   = useSalesTargets(filters);
  const { data: orders,  isPending: ordPending }   = useSalesOrders(filters);
  const { data: insights, isPending: insightsPending } = useSalesInsights(filters);

  const trendData = (trend ?? []) as any[];

  return (
    <AppShell title="Sales Analytics">
      {/* Filter bar */}
      <div className="mb-6">
        <FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} hasFilters={hasFilters}
          show={{ year: true, month: true, dept: true, region: true }} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Revenue"    kpi={{ value: Number(summary?.revenue ?? 0), previous_value: Number(summary?.prev_revenue ?? 0), change_pct: summary?.revenue_growth_pct, direction: (summary?.revenue_growth_pct ?? 0) > 0 ? 'up' : 'down' }} format={formatINR} sparkData={trendData} sparkKey="revenue"  loading={sumPending} accent="#4F46E5" />
        <KpiCard label="Profit"     kpi={{ value: Number(summary?.profit ?? 0), previous_value: Number(summary?.prev_profit ?? 0), change_pct: summary?.profit_growth_pct, direction: (summary?.profit_growth_pct ?? 0) > 0 ? 'up' : 'down' }}  format={formatINR} sparkData={trendData} sparkKey="profit"   loading={sumPending} accent="#16A34A" />
        <KpiCard label="Orders"     kpi={{ value: Number(summary?.total_orders ?? 0), previous_value: Number(summary?.prev_orders ?? 0), change_pct: null, direction: 'neutral' }} format={formatNumber} loading={sumPending} accent="#F59E0B" />
        <KpiCard label="Avg Order"  kpi={{ value: Number(summary?.avg_order_value ?? 0), direction: 'neutral' }} format={formatINR} loading={sumPending} accent="#06B6D4" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          {trendPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader><CardTitle>Monthly Revenue vs Profit</CardTitle></CardHeader>
              <RevenueChart data={trendData} />
            </Card>
          )}
        </div>
        <div>
          {tgtPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader>
                <CardTitle>Actual vs Target</CardTitle>
                <span className="text-[10px] text-muted">Aggregated monthly</span>
              </CardHeader>
              <TargetChart data={targets ?? []} height={240} />
            </Card>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="mb-6">
        <InsightPanel title="Sales Insights" insights={insights ?? []} loading={insightsPending} cap={5} />
      </div>

      {/* By-dimension breakdown */}
      <Card noPad className="mb-6">
        <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Breakdown by Dimension</CardTitle>
          <Tabs
            tabs={DIM_TABS}
            active={filters.dim}
            onChange={(k) => setFilter('dim', k)}
          />
        </div>
        {dimPending
          ? <div className="p-5 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />)}</div>
          : <DimTable data={dimData ?? []} dim={filters.dim} />
        }
      </Card>

      {/* Target achievement table */}
      <Card noPad className="mb-6">
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <CardTitle>Target vs Actual — Per Employee</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {['Employee','Department','Manager','Period','Actual','Target','Achievement','Tier'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tgtPending
                ? [...Array(8)].map((_,i) => <tr key={i}>{[...Array(8)].map((_,j) => <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-20"/></td>)}</tr>)
                : (targets ?? []).slice(0, 50).map((t, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-ink">{t.full_name}</td>
                    <td className="px-4 py-2.5 text-muted">{t.department_name}</td>
                    <td className="px-4 py-2.5 text-muted">{t.manager_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-muted">{t.period_month?.substring(0, 7)}</td>
                    <td className="px-4 py-2.5 font-semibold text-ink">{formatINR(t.actual_revenue)}</td>
                    <td className="px-4 py-2.5 text-muted">{formatINR(t.target_amount)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('font-semibold', t.achievement_pct >= 100 ? 'text-positive' : 'text-negative')}>
                        {t.achievement_pct?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold', TIER_STYLE[t.performance_tier])}>
                        {t.performance_tier}
                      </span>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* Orders table */}
      <Card noPad>
        <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <CardTitle>Orders Feed</CardTitle>
          <div className="flex items-center gap-2">
            <select value={filters.status ?? ''} onChange={e => setFilter('status', e.target.value || null)}
              className="text-xs border border-border rounded-control px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">All statuses</option>
              {['completed','pending','cancelled','returned'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {['Order #','Customer','Employee','Region','Amount','Date','Payment','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordPending
                ? [...Array(10)].map((_,i) => <tr key={i}>{[...Array(8)].map((_,j) => <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-20"/></td>)}</tr>)
                : (orders ?? []).map((o: any) => (
                  <tr key={o.sale_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-medium text-ink">{o.order_number}</td>
                    <td className="px-4 py-2.5 text-ink max-w-[130px] truncate">{o.customer_name}</td>
                    <td className="px-4 py-2.5 text-muted">{o.employee_name}</td>
                    <td className="px-4 py-2.5 text-muted whitespace-nowrap">{o.region_name}</td>
                    <td className="px-4 py-2.5 font-semibold text-ink whitespace-nowrap">{formatINR(o.total_amount)}</td>
                    <td className="px-4 py-2.5 text-muted whitespace-nowrap">{formatDate(o.order_date)}</td>
                    <td className="px-4 py-2.5 text-muted">{o.payment_method}</td>
                    <td className="px-4 py-2.5"><Badge variant={o.status} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted">Showing {orders?.length ?? 0} orders</span>
          <div className="flex items-center gap-2">
            <button disabled={filters.offset === 0}
              onClick={() => setFilter('offset', Math.max(0, filters.offset - filters.limit))}
              className="text-xs px-3 py-1 border border-border rounded-control disabled:opacity-40 hover:bg-canvas transition-colors">
              Prev
            </button>
            <button disabled={(orders?.length ?? 0) < filters.limit}
              onClick={() => setFilter('offset', filters.offset + filters.limit)}
              className="text-xs px-3 py-1 border border-border rounded-control disabled:opacity-40 hover:bg-canvas transition-colors">
              Next
            </button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
