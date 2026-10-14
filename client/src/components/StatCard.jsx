import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import AnimatedNumber from '@/components/AnimatedNumber';

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function StatCard({ icon: Icon, label, value, suffix, hint, tone = 'indigo', index = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06 * index, ease: [0.16, 1, 0.3, 1] }}
      className={cn('group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-slate-900">
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
            {suffix && <span className="ml-1 text-base font-medium text-muted-foreground">{suffix}</span>}
          </p>
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-transform group-hover:scale-110', TONES[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {hint && <div className="mt-3 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}
