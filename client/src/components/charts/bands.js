import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import { COLORS } from '@/components/charts/theme';

/** { good, warning, danger } → dữ liệu donut theo ngưỡng tiến độ (kèm icon, không chỉ dựa vào màu). */
export function bandsToDonut(bands) {
  return [
    { name: 'Đúng tiến độ (≥75%)', value: bands.good, color: COLORS.good, icon: CircleCheck },
    { name: 'Cần chú ý (40–75%)', value: bands.warning, color: COLORS.warning, icon: TriangleAlert },
    { name: 'Chậm tiến độ (<40%)', value: bands.danger, color: COLORS.danger, icon: CircleAlert },
  ];
}
