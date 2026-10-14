import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookUser, Check, GraduationCap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES = [
  {
    key: 'student', label: 'Sinh viên', icon: GraduationCap, color: 'sky',
    title: 'Biết ngay mình còn thiếu bao nhiêu tín chỉ',
    points: ['Vòng tiến độ x / 150 tín chỉ, đổi màu theo ngưỡng', 'Danh sách môn đã đạt kèm điểm', 'Hồ sơ cá nhân, lớp và GV chủ nhiệm'],
  },
  {
    key: 'teacher', label: 'Giáo viên', icon: BookUser, color: 'violet',
    title: 'Quản lý lớp chủ nhiệm trong vài cú nhấp',
    points: ['Thêm, sửa, xoá sinh viên lớp mình', 'Nhập điểm, badge Đạt/Chưa đạt cập nhật tức thì', 'Biểu đồ phân bố tín chỉ, cảnh báo SV chậm tiến độ'],
  },
  {
    key: 'admin', label: 'Quản trị', icon: ShieldCheck, color: 'indigo',
    title: 'Toàn cảnh nhà trường và cấp quyền tập trung',
    points: ['Dashboard nhiều biểu đồ: phân bố, tỉ lệ đạt, sĩ số', 'CRUD lớp, giáo viên, sinh viên, môn học', 'Đổi vai trò, khoá/mở và đặt lại mật khẩu tài khoản'],
  },
];

const ease = [0.16, 1, 0.3, 1];

function StudentPreview() {
  const c = 2 * Math.PI * 52;
  return (
    <div className="grid h-full gap-3 sm:grid-cols-5">
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-5 sm:col-span-2">
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#fef3c7" strokeWidth="12" />
            <motion.circle cx="60" cy="60" r="52" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" strokeDasharray={c}
              initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - 0.58) }} transition={{ duration: 1.2, ease }} />
          </svg>
          <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold">87<span className="text-sm font-normal text-slate-400">/150</span></p>
        </div>
        <span className="mt-3 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">58% · Cần chú ý</span>
      </div>
      <div className="space-y-2 rounded-xl border bg-white p-4 sm:col-span-3">
        {[['IT001', 'Nhập môn lập trình', '8.5'], ['IT003', 'Cấu trúc dữ liệu', '7.0'], ['MA003', 'Đại số tuyến tính', '6.5'], ['IT004', 'Cơ sở dữ liệu', '9.0']].map(([code, name, s], i) => (
          <motion.div key={code} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
            <span><span className="font-mono text-slate-400">{code}</span> · {name}</span>
            <span className="flex items-center gap-2"><b>{s}</b><span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Đạt</span></span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TeacherPreview() {
  return (
    <div className="grid h-full gap-3 sm:grid-cols-2">
      {[['CNTT-K20A', 12, 128], ['KTPM-K21A', 13, 92]].map(([code, n, avg], i) => (
        <motion.div key={code} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">{code}</span>
            <span className="text-xs text-slate-500">{n} sinh viên</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">TB tín chỉ</p>
          <p className="text-xl font-semibold">{avg}<span className="text-xs font-normal text-slate-400"> / 150</span></p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(avg / 150) * 100}%` }} transition={{ duration: 1, ease, delay: 0.2 }} className="h-full rounded-full bg-indigo-500" />
          </div>
          <div className="mt-4 rounded-md bg-indigo-600 py-1.5 text-center text-[11px] font-medium text-white">Xem sinh viên</div>
        </motion.div>
      ))}
      <div className="rounded-xl border bg-white p-4 sm:col-span-2">
        <p className="mb-3 text-xs font-medium text-slate-600">Phân bố tín chỉ lớp chủ nhiệm</p>
        <div className="flex h-20 items-end gap-3">
          {[2, 4, 6, 9, 5, 1].map((v, i) => (
            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${v * 10}%` }} transition={{ delay: 0.3 + i * 0.06, duration: 0.7, ease }} className="flex-1 rounded-t bg-violet-500" style={{ maxWidth: 24 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminPreview() {
  return (
    <div className="grid h-full gap-3 sm:grid-cols-3">
      {[['Lớp', 7], ['Giáo viên', 6], ['Sinh viên', 78]].map(([l, v], i) => (
        <motion.div key={l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">{l}</p>
          <p className="mt-1 text-2xl font-semibold">{v}</p>
        </motion.div>
      ))}
      <div className="rounded-xl border bg-white p-4 sm:col-span-2">
        <p className="mb-3 text-xs font-medium text-slate-600">Tỉ lệ đạt theo môn</p>
        {[['MA001', 72], ['IT003', 81], ['CS401', 88], ['EN002', 93]].map(([c, p], i) => (
          <div key={c} className="mb-2 flex items-center gap-3 text-[11px]">
            <span className="w-11 font-mono text-slate-500">{c}</span>
            <div className="h-2 flex-1 rounded-full bg-slate-100">
              <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.8, ease }} className="h-full rounded-r-full bg-indigo-500" />
            </div>
            <span className="w-8 text-right font-medium">{p}%</span>
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-xl border bg-white p-4">
        <p className="text-xs font-medium text-slate-600">Phân quyền</p>
        {[['admin', 'bg-indigo-100 text-indigo-800'], ['gv001', 'bg-violet-50 text-violet-700'], ['20520101', 'bg-sky-50 text-sky-700']].map(([u, cls]) => (
          <div key={u} className="flex items-center justify-between text-[11px]">
            <span className="font-mono">{u}</span><span className={`rounded px-1.5 py-0.5 ${cls}`}>{u === 'admin' ? 'Quản trị' : u.startsWith('gv') ? 'Giáo viên' : 'Sinh viên'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PREVIEW = { student: StudentPreview, teacher: TeacherPreview, admin: AdminPreview };
const ACTIVE = {
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

export default function RolePreview() {
  const [active, setActive] = useState('teacher');
  const role = ROLES.find((r) => r.key === active);
  const Preview = PREVIEW[active];
  return (
    <div className="grid items-start gap-8 lg:grid-cols-5">
      <div className="space-y-3 lg:col-span-2">
        {ROLES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setActive(r.key)}
            className={cn(
              'w-full rounded-xl border p-4 text-left transition-all',
              active === r.key ? 'border-transparent bg-white shadow-lg shadow-slate-900/5 ring-1 ring-slate-200' : 'border-transparent hover:bg-white/60',
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset', active === r.key ? ACTIVE[r.color] : 'bg-slate-100 text-slate-500 ring-slate-200')}>
                <r.icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{r.label}</p>
                <p className="text-sm text-muted-foreground">{r.title}</p>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {active === r.key && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-12">
                  {r.points.map((p) => (
                    <li key={p} className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {p}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
      <div className="lg:col-span-3">
        <div className="rounded-2xl border bg-slate-50 p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-2 px-1 text-xs text-slate-500">
            <role.icon className="h-3.5 w-3.5" /> Giao diện {role.label.toLowerCase()}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }} className="min-h-[300px]">
              <Preview />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
