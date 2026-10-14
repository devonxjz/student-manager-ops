/** Tooltip của Recharts theo phong cách app: nền trắng, chữ đậm cho giá trị, chấm màu cho series. */
export default function ChartTooltip({ active, payload, label, unit = '', labelFormatter, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[140px] rounded-lg border bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label !== undefined && <p className="mb-1.5 font-medium text-slate-900">{labelFormatter ? labelFormatter(label, payload) : label}</p>}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey ?? p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ background: p.payload?.fill || p.color || p.fill }} />
              {p.name}
            </span>
            <span className="tabular font-semibold text-slate-900">{valueFormatter ? valueFormatter(p.value, p) : p.value}{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
