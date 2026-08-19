import { useState } from 'react';
import { AppShell } from '@/layouts/AppShell';
import { FilterBar } from '@/components/ui/FilterBar';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KpiSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { useFilters } from '@/hooks/useFilters';
import { useInventorySummary, useInventoryByCategory, useInventoryAlerts, useInventoryVelocity, useInventoryInsights } from '@/hooks/useInventory';
import { InsightPanel } from '@/components/ui/InsightPanel';
import { formatINR, formatNumber, formatPct } from '@/lib/format';
import { DEPT_COLORS, cn } from '@/lib/utils';
import type { AlertRow, VelocityRow, CategoryInventory } from '@/api/inventory';

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-bold" style={{ color: accent ?? '#0F172A' }}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

const RISK_STYLE: Record<string, string> = {
  overstock_risk: 'bg-blue-50 text-blue-600',
  stockout_risk:  'bg-negative/10 text-negative',
  out_of_stock:   'bg-red-100 text-red-700',
  healthy:        'bg-positive/10 text-positive',
};
const RISK_LABEL: Record<string, string> = {
  overstock_risk: 'Overstock Risk', stockout_risk: 'Stockout Risk',
  out_of_stock: 'Out of Stock', healthy: 'Healthy',
};
const VEL_STYLE: Record<number, string> = {
  1: 'bg-positive/10 text-positive', 2: 'bg-primary/10 text-primary',
  3: 'bg-warning/10 text-warning',   4: 'bg-slate-100 text-slate-500',
};

export default function InventoryPage() {
  const { filters, setFilter, clearFilters, hasFilters } = useFilters();
  const [alertTab, setAlertTab] = useState('low_stock');

  const { data: summary,   isPending: sumPending }  = useInventorySummary(filters);
  const { data: byCategory,isPending: catPending }  = useInventoryByCategory();
  const { data: allAlerts, isPending: altPending }  = useInventoryAlerts(filters);
  const { data: velocity,  isPending: velPending }  = useInventoryVelocity(filters);
  const { data: insights,  isPending: insightsPending } = useInventoryInsights();

  const filteredAlerts = (allAlerts ?? []).filter((a: AlertRow) =>
    alertTab === 'all' ? true : a.alert_type === alertTab
  );

  const catBars = (byCategory ?? []).map((c: CategoryInventory, i: number) => ({
    label: c.category_name.replace(' & Accessories','').replace(' & Managed Services',''),
    value: c.stock_value,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const catDonut = (byCategory ?? []).map((c: CategoryInventory, i: number) => ({
    department_id: c.category_id,
    department_name: c.category_name.replace(' & Accessories','').replace(' & Managed Services',''),
    revenue: c.stock_value,
    revenue_share_pct: c.value_share_pct,
    profit: 0, total_orders: 0, avg_order_value: 0,
  }));

  const alertCounts = (allAlerts ?? []).reduce<Record<string, number>>((acc, a: AlertRow) => {
    acc[a.alert_type] = (acc[a.alert_type] ?? 0) + 1;
    return acc;
  }, {});

  const alertTabs = [
    { key: 'low_stock',   label: 'Low Stock',    count: alertCounts.low_stock   ?? 0 },
    { key: 'out_of_stock',label: 'Out of Stock', count: alertCounts.out_of_stock ?? 0 },
    { key: 'overstock',   label: 'Overstock',    count: alertCounts.overstock    ?? 0 },
  ];

  return (
    <AppShell title="Inventory Analytics">
      <div className="mb-6">
        <FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} hasFilters={hasFilters}
          show={{ year: false, month: false, dept: false, cat: true }} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {sumPending ? [...Array(5)].map((_,i) => <KpiSkeleton key={i} />) : (<>
          <StatCard label="Total Products"  value={formatNumber(summary?.total_products ?? 0)} />
          <StatCard label="Total Units"     value={formatNumber(summary?.total_units_on_hand ?? 0)} />
          <StatCard label="Stock Value"     value={formatINR(summary?.total_stock_value ?? 0)} accent="#4F46E5" />
          <StatCard label="Low Stock"       value={String(summary?.low_stock_count ?? 0)} sub="Below reorder level" accent="#F59E0B" />
          <StatCard label="Out of Stock"    value={String(summary?.out_of_stock_count ?? 0)} sub="Zero units" accent="#E11D48" />
        </>)}
      </div>

      {/* Insights */}
      <div className="mb-6">
        <InsightPanel title="Inventory Insights" insights={insights ?? []} loading={insightsPending} cap={5} />
      </div>

      {/* Category charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          {catPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader><CardTitle>Stock Value by Category</CardTitle></CardHeader>
              <SimpleBarChart data={catBars} height={240} layout="horizontal" formatValue={formatINR} />
            </Card>
          )}
        </div>
        <div>
          {catPending ? <ChartSkeleton height={240} /> : (
            <Card>
              <CardHeader><CardTitle>Value Distribution</CardTitle></CardHeader>
              <DonutChart data={catDonut} />
            </Card>
          )}
        </div>
      </div>

      {/* Alerts tabs */}
      <Card noPad className="mb-6">
        <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Inventory Alerts</CardTitle>
          <Tabs tabs={alertTabs} active={alertTab} onChange={setAlertTab} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {['SKU','Product','Category','On Hand','Reorder Level','Stock Value','Status','Shortage'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {altPending
                ? [...Array(6)].map((_,i) => <tr key={i}>{[...Array(8)].map((_,j) => <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-20"/></td>)}</tr>)
                : filteredAlerts.map((a: AlertRow) => (
                  <tr key={a.product_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted">{a.sku}</td>
                    <td className="px-4 py-2.5 font-medium text-ink max-w-[180px] truncate">{a.product_name}</td>
                    <td className="px-4 py-2.5 text-muted">{a.category_name}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('font-bold', a.quantity_on_hand === 0 ? 'text-negative' : 'text-ink')}>
                        {a.quantity_on_hand}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{a.reorder_level}</td>
                    <td className="px-4 py-2.5 text-muted">{formatINR(a.stock_value)}</td>
                    <td className="px-4 py-2.5"><Badge variant={a.alert_type} /></td>
                    <td className="px-4 py-2.5 text-muted">
                      {a.units_short > 0 ? <span className="text-negative font-semibold">-{a.units_short}</span>
                        : a.units_excess > 0 ? <span className="text-blue-500 font-semibold">+{a.units_excess}</span>
                        : '—'}
                    </td>
                  </tr>
                ))
              }
              {!altPending && filteredAlerts.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted text-xs">No {alertTab.replace('_',' ')} items.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Velocity analysis table */}
      <Card noPad>
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Stock vs Sales Velocity</CardTitle>
              <p className="text-xs text-muted mt-0.5">NTILE(4) velocity quartiles + months-of-cover risk flags</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {['SKU','Product','Category','On Hand','Avg Monthly Out','Months Cover','Turnover Ratio','Velocity','Risk Flag'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {velPending
                ? [...Array(10)].map((_,i) => <tr key={i}>{[...Array(9)].map((_,j) => <td key={j} className="px-4 py-2.5"><div className="h-3 bg-slate-100 rounded animate-pulse w-16"/></td>)}</tr>)
                : (velocity ?? []).slice(0, 60).map((v: VelocityRow) => (
                  <tr key={v.product_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted">{v.sku}</td>
                    <td className="px-4 py-2.5 font-medium text-ink max-w-[160px] truncate">{v.product_name}</td>
                    <td className="px-4 py-2.5 text-muted">{v.category_name}</td>
                    <td className="px-4 py-2.5 font-semibold text-ink">{v.quantity_on_hand}</td>
                    <td className="px-4 py-2.5 text-muted">{v.avg_monthly_outbound?.toFixed(1)}</td>
                    <td className="px-4 py-2.5">
                      {v.months_of_cover != null ? (
                        <span className={cn('font-semibold', v.months_of_cover < 2 ? 'text-negative' : v.months_of_cover > 12 ? 'text-blue-600' : 'text-ink')}>
                          {v.months_of_cover.toFixed(1)} mo
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{v.turnover_ratio?.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold', VEL_STYLE[v.velocity_quartile])}>
                        {v.velocity_label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {v.risk_flag !== 'healthy' && (
                        <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold', RISK_STYLE[v.risk_flag])}>
                          {RISK_LABEL[v.risk_flag]}
                        </span>
                      )}
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
