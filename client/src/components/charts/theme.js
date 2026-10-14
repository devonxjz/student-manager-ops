// Thông số dùng chung cho Recharts: nét mảnh, lưới mờ, chữ dùng màu chữ (không dùng màu series).
export const COLORS = {
  primary: '#4f46e5',
  primarySoft: '#c7d2fe',
  series: ['#4f46e5', '#eb6834', '#1baf7a'], // thứ tự categorical cố định
  good: '#10b981',
  warning: '#f59e0b',
  danger: '#e11d48',
  grid: '#e2e8f0',
  axis: '#94a3b8',
  text: '#475569',
};

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: COLORS.axis, fontSize: 12 },
};

export const gridProps = { stroke: COLORS.grid, strokeDasharray: '0', vertical: false };

export const BAR_RADIUS_V = [4, 4, 0, 0];
export const BAR_RADIUS_H = [0, 4, 4, 0];
