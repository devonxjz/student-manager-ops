import { Link, useNavigate } from 'react-router-dom';
import { Award, ChevronRight, GraduationCap, Presentation, TriangleAlert, CircleCheck } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { creditTone, percentOf } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import CreditBar from '@/components/CreditBar';
import ChartCard from '@/components/charts/ChartCard';
import ColumnChart from '@/components/charts/ColumnChart';
import HBarChart from '@/components/charts/HBarChart';
import DonutChart from '@/components/charts/DonutChart';
import { bandsToDonut } from '@/components/charts/bands';

export default function TeacherOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: s, error, loading, reload } = useApi('/teacher/stats');

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !s) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  const avgTone = creditTone(percentOf(s.avgCredits));

  return (
    <>
      <PageHeader
        title={`Xin chào, ${user.profile?.fullName || user.username}`}
        description="Tổng quan các lớp bạn đang chủ nhiệm."
        actions={<Button asChild><Link to="/teacher/classes"><Presentation /> Lớp của tôi</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Presentation} label="Lớp chủ nhiệm" value={s.classCount} tone="violet" index={0} />
        <StatCard icon={GraduationCap} label="Sinh viên" value={s.studentCount} tone="sky" index={1} />
        <StatCard icon={Award} label="TB tín chỉ / SV" value={s.avgCredits} suffix="/ 150" tone="indigo" index={2}
          hint={<span className={avgTone.text}>{percentOf(s.avgCredits)}% · {avgTone.label}</span>} />
        <StatCard icon={TriangleAlert} label="SV chậm tiến độ" value={s.bands.danger} tone={s.bands.danger ? 'rose' : 'emerald'} index={3} hint="Dưới 40% tín chỉ yêu cầu" />
      </div>

      {s.classCount === 0 ? (
        <Card className="mt-6"><EmptyState icon={Presentation} title="Bạn chưa được phân công chủ nhiệm lớp nào" description="Liên hệ quản trị viên để được gán lớp." /></Card>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              index={0}
              title="Phân bố tín chỉ sinh viên"
              description="Số sinh viên theo khoảng tín chỉ đã tích luỹ"
              table={{ columns: [{ key: 'range', header: 'Khoảng tín chỉ' }, { key: 'count', header: 'Số SV', align: 'right' }], rows: s.distribution }}
            >
              <ColumnChart data={s.distribution} xKey="range" yKey="count" name="Sinh viên" />
            </ChartCard>
            <ChartCard
              index={1}
              title="Tiến độ chung"
              description="Theo ngưỡng 40% / 75%"
              table={{ columns: [{ key: 'name', header: 'Nhóm' }, { key: 'value', header: 'Số SV', align: 'right' }], rows: bandsToDonut(s.bands) }}
            >
              <DonutChart data={bandsToDonut(s.bands)} centerLabel="sinh viên" />
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <ChartCard
              className="lg:col-span-2"
              index={2}
              title="TB tín chỉ theo lớp"
              description="Trung bình tín chỉ mỗi sinh viên"
              table={{ columns: [{ key: 'classCode', header: 'Lớp' }, { key: 'studentCount', header: 'Sĩ số', align: 'right' }, { key: 'avgCredits', header: 'TB TC', align: 'right' }], rows: s.byClass }}
            >
              <HBarChart data={s.byClass} labelKey="classCode" valueKey="avgCredits" name="TB tín chỉ" labelWidth={84} colorFn={(r) => creditTone(percentOf(r.avgCredits)).hex} />
            </ChartCard>

            <Card className="lg:col-span-3">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-rose-500" /> Sinh viên cần chú ý</CardTitle>
                  <CardDescription>Dưới 40% tín chỉ yêu cầu</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {s.atRiskStudents.length === 0 ? (
                  <EmptyState icon={CircleCheck} title="Không có sinh viên chậm tiến độ" description="Tất cả sinh viên lớp bạn đều đạt từ 40% trở lên." />
                ) : (
                  <ul className="divide-y border-t">
                    {s.atRiskStudents.map((st) => (
                      <li key={st.id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/classes/${st.classId}/students/${st.id}/results`)}
                          className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{st.fullName}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-mono">{st.studentCode}</span> · {st.class?.classCode}</p>
                          </div>
                          <CreditBar earned={st.earnedCredits} className="w-44" />
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
