import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatINR, formatMonthLabel } from '@/lib/format';

interface Props { data: any[]; height?: number; }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-medium">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ComboChart({ data, height = 260 }: Props) {
  const formatted = data.map(d => ({
    ...d,
    label: formatMonthLabel(d.period),
    net_profit: Number(d.gross_profit ?? 0) - Number(d.total_expenses ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false}
          interval={Math.floor(formatted.length / 8)} />
        <YAxis yAxisId="left" tickFormatter={(v) => formatINR(v)} tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false} tickLine={false} width={72} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatINR(v)}
          tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={72} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8}
          formatter={(v) => <span className="text-xs text-muted capitalize">{v}</span>} />
        <Bar yAxisId="left"  dataKey="revenue"         name="Revenue"        fill="#4F46E5" maxBarSize={22} radius={[3,3,0,0]} opacity={0.9} />
        <Bar yAxisId="left"  dataKey="total_expenses"  name="Expenses"       fill="#E11D48" maxBarSize={22} radius={[3,3,0,0]} opacity={0.75} />
        <Line yAxisId="right" type="monotone" dataKey="net_profit" name="Net Profit"
          stroke="#16A34A" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
