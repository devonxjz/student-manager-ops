import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from '@/components/charts/ChartTooltip';
import { formatNumber } from '@/lib/format';

/**
 * Biểu đồ vành khuyên + chú thích có số liệu (danh tính không chỉ dựa vào màu).
 * data: [{ name, value, color }]
 */
export default function DonutChart({ data, centerLabel, centerValue, height = 190 }) {
  const [active, setActive] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[200px] shrink-0" style={{ height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="96%"
              paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 2 : 0}
              stroke="#fff"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
              animationDuration={900}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color} opacity={active === null || active === i ? 1 : 0.35} style={{ transition: 'opacity .2s' }} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip valueFormatter={(v) => `${formatNumber(v)} (${total ? Math.round((v / total) * 100) : 0}%)`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">{centerValue ?? formatNumber(total)}</span>
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
        </div>
      </div>
      <ul className="w-full space-y-1">
        {data.map((d, i) => (
          <li
            key={d.name}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm transition-colors hover:bg-slate-50"
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
              {d.icon && <d.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
              <span className="truncate">{d.name}</span>
            </span>
            <span className="tabular shrink-0 font-medium text-slate-900">
              {formatNumber(d.value)}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
