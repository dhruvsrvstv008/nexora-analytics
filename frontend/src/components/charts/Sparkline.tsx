import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Props {
  data: { value: number }[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = '#4F46E5', height = 36 }: Props) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width={80} height={height}>
      <LineChart data={data}>
        <Line
          type="monotone" dataKey="value"
          stroke={color} strokeWidth={1.5}
          dot={false} isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
