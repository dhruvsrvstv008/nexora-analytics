import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DEPT_COLORS } from '@/lib/utils';
import type { DeptData } from '@/types';

interface Props { data: DeptData[]; }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold">{d.name}</p>
      <p className="text-slate-300">{d.payload.revenue_share_pct?.toFixed(1)}% of revenue</p>
    </div>
  );
}

export function DonutChart({ data }: Props) {
  const top8 = data.slice(0, 8);

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={top8} dataKey="revenue_share_pct" nameKey="department_name"
            cx="50%" cy="50%" innerRadius={52} outerRadius={80}
            paddingAngle={2} strokeWidth={0}
          >
            {top8.map((_, i) => (
              <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="w-full space-y-1.5">
        {top8.map((d, i) => (
          <div key={d.department_id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }}
              />
              <span className="text-muted truncate max-w-[120px]">{d.department_name}</span>
            </div>
            <span className="font-semibold text-ink">
              {d.revenue_share_pct?.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
