import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';
import { FilterBar } from '@/components/ui/FilterBar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFilters } from '@/hooks/useFilters';
import { useManagerLeaderboard } from '@/hooks/useManagers';
import { formatINR, formatNumber, formatPct } from '@/lib/format';
import { DEPT_COLORS, cn } from '@/lib/utils';

export default function ManagersPage() {
  const { filters, setFilter, clearFilters, hasFilters } = useFilters();
  const { data: managers, isPending } = useManagerLeaderboard(filters);
  const navigate = useNavigate();

  return (
    <AppShell title="Manager Performance">
      <div className="mb-6">
        <FilterBar filters={filters} setFilter={setFilter} clearFilters={clearFilters} hasFilters={hasFilters}
          show={{ year: true, month: true, dept: true }} />
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {isPending
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-card border border-border shadow-card p-5 h-24 animate-pulse bg-slate-50" />
            ))
          : [
              { label: 'Total Managers',    value: formatNumber(managers?.length ?? 0) },
              { label: 'Total Team Revenue',value: formatINR((managers ?? []).reduce((s, m) => s + Number(m.revenue ?? 0), 0)) },
              { label: 'Top Revenue',       value: formatINR(managers?.[0]?.revenue ?? 0) },
              { label: 'Total Team Members',value: formatNumber((managers ?? []).reduce((s, m) => s + Number(m.team_size ?? 0), 0)) },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-card border border-border shadow-card p-5">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">{k.label}</p>
                <p className="mt-2 text-2xl font-bold text-ink">{k.value}</p>
              </div>
            ))
        }
      </div>

      {/* Leaderboard */}
      <Card noPad>
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <CardTitle>Manager Leaderboard — click a row to drill into the team</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {['Rank','Manager','Department','Team','Revenue','Profit','Orders','Avg Order'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted font-semibold whitespace-nowrap">{h}</th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {isPending
                ? [...Array(8)].map((_,i) => (
                    <tr key={i}>{[...Array(8)].map((_,j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-20"/></td>
                    ))}</tr>
                  ))
                : (managers ?? []).map((mgr, i) => (
                  <tr
                    key={mgr.manager_id}
                    onClick={() => navigate(`/managers/${mgr.manager_id}`)}
                    className="border-b border-border/50 last:border-0 hover:bg-canvas cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-lg font-black text-muted/40">{String(i + 1).padStart(2, '0')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }}>
                          {mgr.manager_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{mgr.manager_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{mgr.department_name}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-ink">{mgr.team_size}</span>
                      <span className="text-muted ml-1">people</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-ink whitespace-nowrap">{formatINR(mgr.revenue)}</td>
                    <td className="px-4 py-3 text-positive font-semibold whitespace-nowrap">{formatINR(mgr.profit)}</td>
                    <td className="px-4 py-3 text-muted">{formatNumber(mgr.total_orders)}</td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{formatINR(mgr.avg_order_value)}</td>
                    <td className="px-4 py-3">
                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
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
