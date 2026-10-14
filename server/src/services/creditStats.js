// Hàm thuần để gom số liệu tín chỉ cho các biểu đồ (dùng ở dashboard admin, giáo viên, lớp)
const { TOTAL_REQUIRED_CREDITS } = require('../config/constants');

const percentOf = (earned) => (earned / TOTAL_REQUIRED_CREDITS) * 100;

// Làm tròn trung bình; danh sách rỗng -> 0
exports.average = (credits) => (credits.length ? Math.round(credits.reduce((a, b) => a + b, 0) / credits.length) : 0);

// Ngưỡng màu theo SPEC 7.1: >=75% tốt, 40-75% cần chú ý, <40% chậm tiến độ
exports.AT_RISK_PERCENT = 40;
exports.isAtRisk = (earned) => percentOf(earned) < exports.AT_RISK_PERCENT;

exports.bands = (credits) => {
  const pct = credits.map(percentOf);
  return {
    good: pct.filter((p) => p >= 75).length,
    warning: pct.filter((p) => p >= 40 && p < 75).length,
    danger: pct.filter((p) => p < 40).length,
  };
};

const BUCKETS = [
  { range: '0–29', min: 0, max: 29 },
  { range: '30–59', min: 30, max: 59 },
  { range: '60–89', min: 60, max: 89 },
  { range: '90–119', min: 90, max: 119 },
  { range: '120–149', min: 120, max: 149 },
  { range: '150+', min: 150, max: Infinity },
];

exports.distribution = (credits) => BUCKETS.map((b) => ({
  range: b.range, count: credits.filter((c) => c >= b.min && c <= b.max).length,
}));
