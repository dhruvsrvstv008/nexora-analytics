import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Bar, BarChart, ComposedChart, Line,
} from 'recharts';
import { formatMonthLabel } from '@/lib/format';
import type { HeadcountPoint } from '@/api/workforce';

interface Props { data: HeadcountPoint[]; height?: number; }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300 capitalize">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function HeadcountChart({ data, height = 220 }: Props) {
  const formatted = data.map(d => ({ ...d, label: formatMonthLabel(d.period) }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false}
          interval={Math.floor(formatted.length / 6)} />
        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={36} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8}
          formatter={(v) => <span className="text-xs text-muted capitalize">{v}</span>} />
        <Bar dataKey="new_hires" name="New Hires" fill="#16A34A" maxBarSize={16} radius={[2,2,0,0]} />
        <Bar dataKey="exits"     name="Exits"     fill="#E11D48" maxBarSize={16} radius={[2,2,0,0]} />
        <Line type="monotone" dataKey="active_headcount" name="Headcount"
          stroke="#4F46E5" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
