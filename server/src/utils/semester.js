// Học kỳ hiện tại theo dạng "YYYY-N" (khớp CHECK trong schema.sql), tính theo ngày UTC:
//   tháng 8-12 -> HK1 năm đó; tháng 1 -> HK1 năm trước (HK1 kéo dài sang tháng 1);
//   tháng 2-6 -> HK2; tháng 7 -> HK3 (học hè)
exports.currentSemester = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  if (month >= 8) return `${year}-1`;
  if (month === 1) return `${year - 1}-1`;
  if (month <= 6) return `${year - 1}-2`;
  return `${year - 1}-3`;
};
