import { motion } from 'framer-motion';
import { Award, BookCheck, CircleAlert, Target, TriangleAlert } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { creditTone } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import CreditRing from '@/components/charts/CreditRing';

const THRESHOLDS = [
  { label: '< 40%', desc: 'Chậm tiến độ', cls: 'bg-rose-500' },
  { label: '40–75%', desc: 'Cần chú ý', cls: 'bg-amber-500' },
  { label: '≥ 75%', desc: 'Đúng tiến độ', cls: 'bg-emerald-500' },
];

export default function MyCreditsPage() {
  const { user } = useAuth();
  const { data: d, error, loading, reload } = useApi('/me/credits');

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !d) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-1" /><Skeleton className="h-80 lg:col-span-2" /></div>
      </div>
    );
  }

  const tone = creditTone(d.percent);
  const remaining = Math.max(0, d.total - d.earned);
  const firstName = (user.profile?.fullName || '').split(' ').at(-1);
  const avgScore = d.courses.length ? (d.courses.reduce((a, c) => a + Number(c.score), 0) / d.courses.length).toFixed(2) : '—';

  return (
    <>
      <PageHeader title={`Chào ${firstName || 'bạn'} 👋`} description={`Tiến độ tín chỉ của ${user.profile?.studentCode || user.username} · Lớp ${user.profile?.class?.classCode || '—'}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Tiến độ tín chỉ</CardTitle>
              <CardDescription>Tính từ các môn có điểm ≥ 5</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <CreditRing earned={d.earned} total={d.total} percent={d.percent} />
              <p className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${tone.text}`} data-testid="credit-summary">
                {tone.key === 'good' ? <Award className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
                Đã đạt {d.earned} / {d.total} tín chỉ ({d.percent}%) · {tone.label}
              </p>
              <div className="mt-5 w-full space-y-2">
                <div className="flex h-2 w-full overflow-hidden rounded-full">
                  <div className="w-[40%] bg-rose-100" /><div className="w-[35%] border-x-2 border-white bg-amber-100" /><div className="w-[25%] bg-emerald-100" />
                </div>
                <div className="relative h-0">
                  <motion.span initial={{ left: 0 }} animate={{ left: `${d.percent}%` }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="absolute -top-[14px] h-3 w-1 -translate-x-1/2 rounded-full bg-slate-900" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-muted-foreground">
                  {THRESHOLDS.map((t, i) => (
                    <span key={t.label} className={`flex flex-col ${i === 1 ? 'items-center' : i === 2 ? 'items-end' : ''}`}>
                      <span className="flex items-center gap-1 font-medium text-slate-600"><span className={`h-1.5 w-1.5 rounded-full ${t.cls}`} />{t.desc}</span>
                      <span>{t.label}</span>
                    </span>
                  ))}
                </div>
              </div>
              <dl className="mt-6 w-full divide-y rounded-lg border text-sm">
                {[
                  ['Điểm TB các môn đạt', avgScore],
                  ['Số môn chưa đạt', d.failedCourses?.length ?? 0],
                  ['Tổng tín chỉ yêu cầu', d.total],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-3 py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="tabular font-semibold text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Award} label="Đã đạt" value={d.earned} suffix="tín chỉ" tone="emerald" index={0} />
            <StatCard icon={Target} label="Còn thiếu" value={remaining} suffix="tín chỉ" tone={remaining === 0 ? 'emerald' : 'amber'} index={1} hint={remaining === 0 ? 'Đủ điều kiện tín chỉ tốt nghiệp' : `Khoảng ${Math.ceil(remaining / 20)} học kỳ nữa (20 TC/kỳ)`} />
            <StatCard icon={BookCheck} label="Số môn đạt" value={d.courses.length} suffix="môn" tone="indigo" index={2} />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Môn đã đạt</CardTitle>
                <CardDescription>{d.courses.length} môn · {d.earned} tín chỉ</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {d.courses.length === 0 ? (
                <EmptyState title="Chưa có môn nào đạt" description="Khi giáo viên nhập điểm ≥ 5, môn học sẽ xuất hiện ở đây." />
              ) : (
                <div className="max-h-[420px] overflow-auto border-t">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Mã môn</TableHead><TableHead>Tên môn</TableHead>
                        <TableHead className="text-right">Số TC</TableHead><TableHead className="text-right">Điểm</TableHead><TableHead>Kết quả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.courses.map((c) => (
                        <TableRow key={c.code}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{c.code}</TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="tabular text-right">{c.credits}</TableCell>
                          <TableCell className="tabular text-right font-semibold">{Number(c.score).toFixed(1)}</TableCell>
                          <TableCell><Badge variant="success">Đạt</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {d.failedCourses?.length > 0 && (
            <Card className="border-rose-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CircleAlert className="h-4 w-4 text-rose-600" /> Môn chưa đạt</CardTitle>
                <CardDescription>Cần học lại để tích luỹ tín chỉ</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {d.failedCourses.map((c) => (
                  <span key={c.code} className="inline-flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-1.5 text-sm">
                    <span className="font-mono text-xs text-rose-500">{c.code}</span> {c.name}
                    <Badge variant="destructive">{Number(c.score).toFixed(1)}</Badge>
                  </span>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
