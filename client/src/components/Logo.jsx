import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo({ className, compact = false, light = false }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
        <GraduationCap className="h-[18px] w-[18px]" />
      </div>
      {!compact && (
        <span className={cn('text-[15px] font-semibold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
          Student<span className={light ? 'text-indigo-200' : 'text-primary'}>Manager</span>
        </span>
      )}
    </div>
  );
}
