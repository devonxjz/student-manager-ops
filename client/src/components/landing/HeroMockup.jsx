import { motion } from 'framer-motion';
import { Award, BookOpen, CheckCircle2, GraduationCap, LayoutDashboard, School, ShieldCheck, Users } from 'lucide-react';

const BARS = [38, 62, 84, 71, 96, 54, 78];
const ease = [0.16, 1, 0.3, 1];

function MiniStat({ icon: Icon, label, value, tint, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease }}
      className="rounded-lg border bg-white p-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-500">{label}</span>
        <span className={`flex h-5 w-5 items-center justify-center rounded ${tint}`}><Icon className="h-3 w-3" /></span>
      </div>
      <p className="mt-1.5 text-base font-semibold text-slate-900">{value}</p>
    </motion.div>
  );
}

/** Mockup dashboard admin thu nhỏ, các phần tử xuất hiện lần lượt. */
export default function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Khung trình duyệt */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.35, ease }}
        style={{ transformPerspective: 1600 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-indigo-500/10 ring-1 ring-slate-900/5"
      >
        <div className="flex items-center gap-2 border-b bg-slate-50/80 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="ml-4 hidden flex-1 rounded-md border bg-white px-3 py-1 text-[11px] text-slate-400 sm:block">sm-prod.ap-southeast-1.elasticbeanstalk.com/admin</div>
        </div>
        <div className="flex">
          {/* sidebar */}
          <div className="hidden w-44 shrink-0 border-r bg-white p-3 sm:block">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><GraduationCap className="h-3.5 w-3.5" /></div>
              <span className="text-[11px] font-semibold">StudentManager</span>
            </div>
            {[
              [LayoutDashboard, 'Dashboard', true], [School, 'Lớp học'], [Users, 'Giáo viên'],
              [GraduationCap, 'Sinh viên'], [BookOpen, 'Môn học'], [ShieldCheck, 'Phân quyền'],
            ].map(([Icon, label, active], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-500'}`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </motion.div>
            ))}
          </div>
          {/* nội dung */}
          <div className="flex-1 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Dashboard</p>
                <p className="text-[10px] text-slate-500">Tổng quan toàn trường · HK1 2026</p>
              </div>
              <span className="rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white">+ Thêm lớp</span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <MiniStat icon={School} label="Lớp" value="7" tint="bg-indigo-50 text-indigo-600" delay={0.9} />
              <MiniStat icon={Users} label="Giáo viên" value="6" tint="bg-violet-50 text-violet-600" delay={0.97} />
              <MiniStat icon={GraduationCap} label="Sinh viên" value="78" tint="bg-sky-50 text-sky-600" delay={1.04} />
              <MiniStat icon={BookOpen} label="Môn học" value="51" tint="bg-emerald-50 text-emerald-600" delay={1.11} />
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div className="rounded-lg border bg-white p-3 md:col-span-2">
                <p className="text-[10px] font-medium text-slate-600">Phân bố tín chỉ</p>
                <div className="mt-3 flex h-28 items-end gap-2 border-b border-slate-100">
                  {BARS.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1.2 + i * 0.07, duration: 0.8, ease }}
                      className="flex-1 rounded-t bg-indigo-500/90"
                      style={{ maxWidth: 28 }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center rounded-lg border bg-white p-3">
                <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#e0e7ff" strokeWidth="9" />
                  <motion.circle
                    cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={201}
                    initial={{ strokeDashoffset: 201 }}
                    animate={{ strokeDashoffset: 201 * 0.42 }}
                    transition={{ delay: 1.3, duration: 1.3, ease }}
                  />
                </svg>
              </div>
            </div>
            <div className="mt-2 hidden rounded-lg border bg-white md:block">
              {['CNTT-K20A · Nguyễn Thị Minh Anh · 12 SV', 'KTPM-K21A · Nguyễn Thị Minh Anh · 13 SV', 'CNTT-K23A · Chưa có GVCN · 9 SV'].map((row, i) => (
                <motion.div
                  key={row}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + i * 0.1 }}
                  className="flex items-center justify-between border-b px-3 py-2 text-[10px] text-slate-600 last:border-0"
                >
                  {row}
                  <span className={`rounded px-1.5 py-0.5 ${i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{i === 2 ? 'Cần gán' : 'Đủ'}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Thẻ nổi */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.6, duration: 0.7, ease }}
        className="absolute -left-4 top-1/3 hidden lg:block xl:-left-14"
      >
        <div className="animate-float rounded-xl border bg-white p-3.5 shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Award className="h-5 w-5" /></div>
            <div>
              <p className="text-[11px] text-slate-500">Tín chỉ đã đạt</p>
              <p className="text-sm font-semibold">128 <span className="font-normal text-slate-400">/ 150</span></p>
            </div>
          </div>
          <div className="mt-2.5 h-1.5 w-40 overflow-hidden rounded-full bg-emerald-100">
            <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ delay: 2, duration: 1.2, ease }} className="h-full rounded-full bg-emerald-500" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 2.1, duration: 0.7, ease }}
        className="absolute -right-4 bottom-16 hidden lg:block xl:-right-12"
      >
        <div className="flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-xl shadow-slate-900/10" style={{ animation: 'float 7s ease-in-out 1s infinite' }}>
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-xs font-semibold">Đã lưu điểm</p>
            <p className="text-[11px] text-slate-500">IT003 · 8.5 · Đạt</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
