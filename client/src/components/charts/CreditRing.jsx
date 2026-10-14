import { motion } from 'framer-motion';
import AnimatedNumber from '@/components/AnimatedNumber';
import { creditTone } from '@/lib/format';

/** Vòng tròn tiến độ tín chỉ lớn cho trang sinh viên. Màu theo ngưỡng; vết nền cùng tông nhạt hơn. */
export default function CreditRing({ earned, total, percent, size = 240, stroke = 18 }) {
  const tone = creditTone(percent);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Đã đạt ${earned} trên ${total} tín chỉ, ${percent}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={tone.text} stroke="currentColor" opacity={0.12} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={tone.hex}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - percent / 100) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-medium text-muted-foreground">Đã tích luỹ</span>
        <span className="mt-1 text-5xl font-bold tracking-tight text-slate-900">
          <AnimatedNumber value={earned} duration={1.4} />
        </span>
        <span className="mt-1 text-sm text-muted-foreground">/ {total} tín chỉ</span>
        <span className={`mt-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.text} bg-slate-50 ring-1 ring-slate-200`}>{percent}%</span>
      </div>
    </div>
  );
}
