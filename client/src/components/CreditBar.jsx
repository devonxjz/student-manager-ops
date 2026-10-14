import { cn } from '@/lib/utils';
import { creditTone, percentOf, TOTAL_REQUIRED_CREDITS } from '@/lib/format';

/** Thanh tín chỉ nhỏ dùng trong bảng; màu theo ngưỡng 40% / 75%. */
export default function CreditBar({ earned, total = TOTAL_REQUIRED_CREDITS, className }) {
  const p = percentOf(earned, total);
  const tone = creditTone(p);
  return (
    <div className={cn('flex min-w-[140px] items-center gap-2.5', className)} title={`${earned}/${total} tín chỉ · ${tone.label}`}>
      <div className={cn('h-1.5 flex-1 overflow-hidden rounded-full', tone.track)}>
        <div className={cn('h-full rounded-full transition-all duration-700', tone.bar)} style={{ width: `${p}%` }} />
      </div>
      <span className="tabular w-[52px] text-right text-xs font-medium text-slate-700">{earned}<span className="text-muted-foreground">/{total}</span></span>
    </div>
  );
}
