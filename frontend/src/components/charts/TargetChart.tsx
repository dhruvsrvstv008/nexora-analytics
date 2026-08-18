import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { formatINR, formatMonthLabel } from '@/lib/format';
import type { TargetRow } from '@/api/sales';

interface Props { data: TargetRow[]; height?: number; }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const pct = row?.target > 0 ? (row.actual / row.target * 100) : 0;
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      <div className="flex gap-3">
        <div><p className="text-slate-400">Actual</p><p className="font-medium">{formatINR(row?.actual ?? 0)}</p></div>
        <div><p className="text-slate-400">Target</p><p className="font-medium">{formatINR(row?.target ?? 0)}</p></div>
      </div>
      <p className={pct >= 100 ? 'text-green-400' : 'text-red-400'}>Achievement: {pct.toFixed(1)}%</p>
    </div>
  );
}

export function TargetChart({ data, height = 240 }: Props) {
  // Aggregate per-employee rows into monthly totals for the chart (presentation only — SQL computed the per-employee values)
  const byMonth: Record<string, { actual: number; target: number; label: string }> = {};
  data.forEach(row => {
    const key = row.period_month.substring(0, 7);
    if (!byMonth[key]) byMonth[key] = { actual: 0, target: 0, label: formatMonthLabel(row.period_month) };
    byMonth[key].actual += Number(row.actual_revenue);
    byMonth[key].target += Number(row.target_amount);
  });

  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_, v]) => v);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={68} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8}
          formatter={(v) => <span className="text-xs text-muted capitalize">{v}</span>} />
        <Bar dataKey="actual" name="Actual" radius={[4,4,0,0]} fill="#4F46E5" maxBarSize={24} />
        <Bar dataKey="target" name="Target" radius={[4,4,0,0]} fill="#E2E8F0"  maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
