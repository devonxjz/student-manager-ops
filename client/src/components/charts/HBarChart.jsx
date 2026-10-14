import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from '@/components/charts/ChartTooltip';
import { axisProps, BAR_RADIUS_H, COLORS } from '@/components/charts/theme';

/** Thanh ngang một series, nhãn giá trị ở đầu thanh. */
export default function HBarChart({ data, labelKey, valueKey, name, color = COLORS.primary, colorFn, unit = '', domain, height, labelWidth = 64, tooltipLabel }) {
  const h = height || Math.max(180, data.length * 34 + 20);
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid stroke={COLORS.grid} horizontal={false} />
          <XAxis type="number" {...axisProps} domain={domain} hide />
          <YAxis type="category" dataKey={labelKey} {...axisProps} width={labelWidth} tick={{ fill: COLORS.text, fontSize: 12 }} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip unit={unit} labelFormatter={tooltipLabel} />} />
          <Bar dataKey={valueKey} name={name} fill={color} radius={BAR_RADIUS_H} maxBarSize={20} animationDuration={900}>
            {colorFn && data.map((row, i) => <Cell key={i} fill={colorFn(row)} />)}
            <LabelList dataKey={valueKey} position="right" offset={8} formatter={(v) => `${v}${unit}`} className="fill-slate-700 text-[11px] font-medium" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
