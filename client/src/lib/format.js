export const TOTAL_REQUIRED_CREDITS = 150;
export const PASS_SCORE = 5;

export const percentOf = (earned, total = TOTAL_REQUIRED_CREDITS) => Math.min(100, Math.round((earned / total) * 100));

/** Ngưỡng màu theo SPEC 7.1: ≥75% xanh, 40–75% vàng, <40% đỏ */
export function creditTone(percent) {
  if (percent >= 75) return { key: 'good', label: 'Đúng tiến độ', text: 'text-emerald-600', bar: 'bg-emerald-500', track: 'bg-emerald-100', hex: '#10b981', badge: 'success' };
  if (percent >= 40) return { key: 'warning', label: 'Cần chú ý', text: 'text-amber-600', bar: 'bg-amber-500', track: 'bg-amber-100', hex: '#f59e0b', badge: 'warning' };
  return { key: 'danger', label: 'Chậm tiến độ', text: 'text-rose-600', bar: 'bg-rose-500', track: 'bg-rose-100', hex: '#e11d48', badge: 'destructive' };
}

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
export const formatNumber = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0);

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase() || '?';

export const ROLE_LABEL = { student: 'Sinh viên', teacher: 'Giáo viên', admin: 'Quản trị' };
export const HOME_BY_ROLE = { student: '/me/credits', teacher: '/teacher', admin: '/admin' };
