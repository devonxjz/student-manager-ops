import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Presentation, Search, TriangleAlert, Users } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { creditTone, percentOf } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/PageHeader';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';

export default function MyClassesPage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const { data, error, loading, reload } = useApi('/teacher/classes');
  const [q, setQ] = useState('');

  const classes = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (data || []).filter((c) => !k || c.classCode.toLowerCase().includes(k) || c.name.toLowerCase().includes(k) || c.teacher?.fullName.toLowerCase().includes(k));
  }, [data, q]);

  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Nhập điểm theo lớp' : 'Lớp của tôi'}
        description={isAdmin ? 'Quản trị viên có thể xem và nhập điểm cho mọi lớp.' : 'Các lớp bạn đang chủ nhiệm. Chọn lớp để quản lý sinh viên và nhập điểm.'}
        actions={(data?.length || 0) > 3 && (
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm lớp…" className="pl-9" aria-label="Tìm lớp" />
          </div>
        )}
      />

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : classes.length === 0 ? (
        <Card><EmptyState icon={Presentation} title={q ? 'Không tìm thấy lớp' : 'Chưa có lớp nào'} description={q ? undefined : 'Bạn chưa được phân công chủ nhiệm lớp nào.'} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c, i) => {
            const p = percentOf(c.avgCredits);
            const tone = creditTone(p);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3 }}
              >
                <Card className="group flex h-full flex-col p-5 transition-shadow hover:shadow-lg hover:shadow-slate-900/5" data-testid="class-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100">{c.classCode}</span>
                      <p className="mt-2 truncate font-semibold text-slate-900">{c.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        GVCN: {c.teacher?.fullName || <span className="font-medium text-amber-600">Chưa phân công</span>}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200">
                      <Presentation className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> Sĩ số</p>
                      <p className="mt-0.5 text-lg font-semibold">{c.studentCount}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><TriangleAlert className="h-3 w-3" /> Chậm tiến độ</p>
                      <p className={`mt-0.5 text-lg font-semibold ${c.atRisk ? 'text-rose-600' : 'text-slate-900'}`}>{c.atRisk}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">TB tín chỉ</span>
                      <span className="font-medium"><span className={tone.text}>{c.avgCredits}</span> / 150</span>
                    </div>
                    <div className={`h-1.5 overflow-hidden rounded-full ${tone.track}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ delay: 0.2 + i * 0.06, duration: 0.9 }} className={`h-full rounded-full ${tone.bar}`} />
                    </div>
                  </div>

                  <Button asChild className="mt-5 w-full" variant="outline">
                    <Link to={`/teacher/classes/${c.id}`} className="group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                      Xem sinh viên <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
