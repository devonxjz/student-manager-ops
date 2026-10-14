import { motion } from 'framer-motion';
import { Cloud, Database, FileText, Globe, HardDrive, Server } from 'lucide-react';

function Node({ icon: Icon, title, sub, tint, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay, duration: 0.5 }}
      className="relative z-10 flex w-full items-center gap-3 rounded-xl border bg-white p-4 shadow-sm md:w-auto md:flex-col md:text-center"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}

/** Đường nối có "gói dữ liệu" chạy dọc (ngang trên desktop, dọc trên mobile). */
function Link({ label, short }) {
  return (
    <div className={`relative flex items-center justify-center ${short ? 'md:w-12 md:flex-none' : 'md:flex-1'}`}>
      <div className="h-8 w-px bg-slate-200 md:h-px md:w-full" />
      <span className="absolute h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.15)] md:hidden" style={{ animation: 'flowY 2.2s linear infinite' }} />
      <span className="absolute hidden h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.15)] md:block" style={{ animation: 'flowX 2.2s linear infinite' }} />
      {label && <span className="absolute left-1/2 top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded bg-slate-50 px-1.5 text-[10px] font-medium text-slate-500 md:-top-5 md:left-1/2 md:ml-0 md:-translate-x-1/2 md:translate-y-0">{label}</span>}
    </div>
  );
}

export default function ArchitectureFlow() {
  return (
    <div className="rounded-2xl border bg-slate-50/70 p-6 sm:p-10">
      <style>{`
        @keyframes flowX { from { left: 0%; opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } to { left: 100%; opacity: 0 } }
        @keyframes flowY { from { top: 0%; opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } to { top: 100%; opacity: 0 } }
      `}</style>
      <div className="flex flex-col items-stretch md:flex-row md:items-center">
        <Node icon={Globe} title="Trình duyệt" sub="React SPA" tint="bg-sky-50 text-sky-600" delay={0} />
        <Link label="HTTPS" />
        <div className="relative mt-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-4 pt-6 md:mt-0 md:p-5">
          <span className="absolute -top-3 left-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-medium text-white">Elastic Beanstalk · Node.js 20</span>
          <div className="flex flex-col items-stretch gap-0 md:flex-row md:items-center">
            <Node icon={Cloud} title="nginx" sub="proxy :80" tint="bg-emerald-50 text-emerald-600" delay={0.1} />
            <Link short />
            <Node icon={Server} title="Express" sub="/api + client/dist" tint="bg-indigo-50 text-indigo-600" delay={0.2} />
          </div>
        </div>
        <Link label="3306" />
        <Node icon={Database} title="RDS MySQL 8" sub="db.t3.micro" tint="bg-amber-50 text-amber-600" delay={0.3} />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
          <FileText className="h-4 w-4 text-violet-500" /> <span><b>CloudWatch Logs</b> · log JSON có requestId, giữ 7 ngày</span>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
          <HardDrive className="h-4 w-4 text-rose-500" /> <span><b>S3</b> · lưu các phiên bản source bundle, rollback 1 cú nhấp</span>
        </motion.div>
      </div>
    </div>
  );
}
