import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { formatINR, formatNumber } from '@/lib/format';

interface Props {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (v: number) => string;
  color?: string;
  layout?: 'vertical' | 'horizontal';
  showValues?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-0.5">{label || payload[0]?.payload?.label}</p>
      <p>{payload[0]?.payload?.fmt ?? formatINR(payload[0]?.value)}</p>
    </div>
  );
}

export function SimpleBarChart({ data, height = 220, formatValue = formatINR, color = '#4F46E5', layout = 'horizontal', showValues }: Props) {
  const enriched = data.map(d => ({ ...d, fmt: formatValue(d.value) }));

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={enriched} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" tickFormatter={formatValue} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={120} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {enriched.map((d, i) => (
              <Cell key={i} fill={d.color ?? color} />
            ))}
            {showValues && <LabelList dataKey="fmt" position="right" style={{ fontSize: 10, fill: '#64748B' }} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={enriched} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatValue} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {enriched.map((d, i) => <Cell key={i} fill={d.color ?? color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
