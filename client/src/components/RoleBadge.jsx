import { ShieldCheck, GraduationCap, BookUser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_LABEL } from '@/lib/format';

const STYLE = {
  student: { cls: 'bg-sky-50 text-sky-700 ring-sky-200', Icon: GraduationCap },
  teacher: { cls: 'bg-violet-50 text-violet-700 ring-violet-200', Icon: BookUser },
  admin: { cls: 'bg-indigo-100 text-indigo-800 ring-indigo-300', Icon: ShieldCheck },
};

export default function RoleBadge({ role, className }) {
  const s = STYLE[role] || STYLE.student;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', s.cls, className)}>
      <s.Icon className="h-3 w-3" />
      {ROLE_LABEL[role] || role}
    </span>
  );
}
