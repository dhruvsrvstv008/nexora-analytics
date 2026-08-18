import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatMonthLabel, formatINR } from '@/lib/format';
import type { TrendPoint } from '@/types';

interface Props { data: TrendPoint[]; }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name === 'revenue' ? 'Revenue' : 'Profit'}:</span>
          <span className="font-medium">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: Props) {
  const formatted = data.map((d) => ({ ...d, label: formatMonthLabel(d.period) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="rev-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profit-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false} tickLine={false}
          interval={Math.floor(formatted.length / 8)}
        />
        <YAxis
          tickFormatter={(v) => formatINR(v)}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false} tickLine={false} width={72}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(v) => <span className="text-xs text-muted capitalize">{v}</span>}
        />
        <Area type="monotone" dataKey="revenue" name="revenue"
          stroke="#4F46E5" strokeWidth={2}
          fill="url(#rev-gradient)" dot={false} activeDot={{ r: 4 }} />
        <Area type="monotone" dataKey="profit" name="profit"
          stroke="#16A34A" strokeWidth={2}
          fill="url(#profit-gradient)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
