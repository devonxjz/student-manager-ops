import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from '@/components/charts/ChartTooltip';
import { axisProps, BAR_RADIUS_V, COLORS, gridProps } from '@/components/charts/theme';

/** Biểu đồ cột một series: cột ≤ 28px, bo đầu 4px, nhãn giá trị trên đỉnh. colorFn(row) để tô theo ngưỡng. */
export default function ColumnChart({ data, xKey, yKey, name, color = COLORS.primary, colorFn, height = 260, unit = '', xLabelFormatter, showLabels = true }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 22, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={xKey} {...axisProps} tickFormatter={xLabelFormatter} interval={0} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip unit={unit} />} />
          <Bar dataKey={yKey} name={name} fill={color} radius={BAR_RADIUS_V} maxBarSize={28} animationDuration={900}>
            {colorFn && data.map((row, i) => <Cell key={i} fill={colorFn(row)} />)}
            {showLabels && <LabelList dataKey={yKey} position="top" offset={6} className="fill-slate-600 text-[11px] font-medium" />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
