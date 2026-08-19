import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Package, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';
import { KpiCard } from '@/components/kpi/KpiCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { InsightPanel } from '@/components/ui/InsightPanel';
import { Badge } from '@/components/ui/Badge';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { useExecutiveOverview, useExecutiveInsights } from '@/hooks/useExecutive';
import { formatINR, formatNumber, formatDate } from '@/lib/format';
import type { InventoryAlert } from '@/types';

const YEARS = [2024, 2025, 2026];

export default function ExecutivePage() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const { data, isPending } = useExecutiveOverview(year);
  const { data: insights, isPending: insightsPending } = useExecutiveInsights(year);

  const trend = data?.revenue_trend ?? [];
  const kpis  = data?.kpis;

  return (
    <AppShell title="Executive Dashboard">
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Business Overview</h2>
          <p className="text-xs text-muted mt-0.5">All departments · All regions</p>
        </div>
        <select
          value={year ?? ''}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
          className="text-xs border border-border rounded-control px-3 py-1.5 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All time (24 months)</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Revenue"     kpi={kpis?.revenue}         format={formatINR}    sparkData={trend} sparkKey="revenue"  loading={isPending} accent="#4F46E5" />
        <KpiCard label="Gross Profit"      kpi={kpis?.profit}          format={formatINR}    sparkData={trend} sparkKey="profit"   loading={isPending} accent="#16A34A" />
        <KpiCard label="Active Employees"  kpi={kpis?.headcount}       format={formatNumber} loading={isPending} accent="#F59E0B" />
        <KpiCard label="Inventory Value"   kpi={kpis?.inventory_value} format={formatINR}    loading={isPending} accent="#06B6D4" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Revenue + Profit trend (2/3) */}
        <div className="xl:col-span-2">
          {isPending ? <ChartSkeleton height={260} /> : (
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Profit Trend</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Revenue</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-positive inline-block" />Profit</span>
                </div>
              </CardHeader>
              <RevenueChart data={trend} />
            </Card>
          )}
        </div>

        {/* Sales by department donut (1/3) */}
        <div>
          {isPending ? <ChartSkeleton height={260} /> : (
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Department</CardTitle>
              </CardHeader>
              <DonutChart data={data?.sales_by_department ?? []} />
            </Card>
          )}
        </div>
      </div>

      {/* Insights + Alerts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* Insights panel */}
        <InsightPanel
          title="Executive Insights"
          insights={insights ?? []}
          loading={insightsPending}
          cap={6}
        />

        {/* Inventory alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <Link to="/inventory" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <ul className="space-y-2">
            {isPending
              ? [...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-slate-50 animate-pulse" />)
              : (data?.inventory_alerts ?? []).slice(0, 8).map((alert: InventoryAlert) => (
                <li key={alert.product_id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-3.5 h-3.5 text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate">{alert.product_name}</p>
                    <p className="text-[10px] text-muted">{alert.category_name} · {alert.sku}</p>
                  </div>
                  <Badge variant={alert.alert_type} />
                </li>
              ))
            }
            {!isPending && !data?.inventory_alerts?.length && (
              <p className="text-xs text-muted text-center py-6 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-positive" />
                All inventory levels healthy
              </p>
            )}
          </ul>
        </Card>
      </div>

      {/* Top managers + Recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Top managers ranked list (1/3) */}
        <Card>
          <CardHeader>
            <CardTitle>Top Managers</CardTitle>
            <Link to="/managers" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <ul className="space-y-3">
            {isPending
              ? [...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-slate-50 animate-pulse" />)
              : (data?.top_managers ?? []).map((mgr, i) => (
                <li key={mgr.manager_id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted w-5 text-right flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{mgr.manager_name}</p>
                    <p className="text-[10px] text-muted">{mgr.department_name} · {mgr.team_size} people</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-ink">{formatINR(mgr.revenue)}</p>
                  </div>
                </li>
              ))
            }
          </ul>
        </Card>

        {/* Recent orders table (2/3) */}
        <div className="xl:col-span-2">
          <Card noPad>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/sales" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-canvas">
                    {['Order #', 'Customer', 'Employee', 'Region', 'Amount', 'Date', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-muted whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isPending
                    ? [...Array(8)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 bg-slate-100 rounded animate-pulse w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                    : (data?.recent_orders ?? []).map((order) => (
                      <tr key={order.sale_id} className="border-b border-border/50 last:border-0 hover:bg-canvas/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-ink">{order.order_number}</td>
                        <td className="px-4 py-3 text-ink max-w-[120px] truncate">{order.customer_name}</td>
                        <td className="px-4 py-3 text-muted">{order.employee_name}</td>
                        <td className="px-4 py-3 text-muted">{order.region_name}</td>
                        <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{formatINR(order.total_amount)}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(order.order_date)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={order.status} />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
