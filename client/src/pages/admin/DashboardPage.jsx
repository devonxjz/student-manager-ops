import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, BookOpen, GraduationCap, KeyRound, Lock, Plus, School, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { creditTone, percentOf, ROLE_LABEL } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import ChartCard from '@/components/charts/ChartCard';
import ColumnChart from '@/components/charts/ColumnChart';
import HBarChart from '@/components/charts/HBarChart';
import DonutChart from '@/components/charts/DonutChart';
import ChartTooltip from '@/components/charts/ChartTooltip';
import { axisProps, COLORS, gridProps } from '@/components/charts/theme';
import { bandsToDonut } from '@/components/charts/bands';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-60" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72" /><Skeleton className="h-72 lg:col-span-2" /></div>
    </div>
  );
}

/** Đường cong tích luỹ: % sinh viên đã đạt ít nhất X tín chỉ (dạng area). */
function CumulativeChart({ distribution }) {
  const total = distribution.reduce((s, d) => s + d.count, 0) || 1;
  let acc = total;
  const data = distribution.map((d) => {
    const row = { range: `≥ ${d.range.split('–')[0].replace('+', '')}`, percent: Math.round((acc / total) * 100) };
    acc -= d.count;
    return row;
  });
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="cum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.18} />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="range" {...axisProps} />
          <YAxis {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip cursor={{ stroke: COLORS.axis, strokeWidth: 1 }} content={<ChartTooltip unit="%" labelFormatter={(l) => `${l} tín chỉ`} />} />
          <Area type="monotone" dataKey="percent" name="Tỉ lệ SV" stroke={COLORS.primary} strokeWidth={2} fill="url(#cum)" dot={{ r: 4, fill: COLORS.primary, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1100} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const { data: s, error, loading, reload } = useApi('/admin/stats');
  const [classMetric, setClassMetric] = useState('count');

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !s) return <DashboardSkeleton />;

  const roleData = s.roles.map((r, i) => ({ name: ROLE_LABEL[r.role], value: r.count, color: COLORS.series[i] }));
  const accountData = [
    { name: 'Đang hoạt động', value: s.accounts.active, color: COLORS.good, icon: UserCheck },
    { name: 'Bị khoá', value: s.accounts.locked, color: COLORS.danger, icon: Lock },
  ];
  const avgTone = creditTone(percentOf(s.avgCredits));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Tổng quan toàn trường: lớp học, giảng viên, sinh viên và tiến độ tín chỉ."
        actions={(
          <>
            <Button asChild variant="outline"><Link to="/admin/users"><ShieldCheck /> Phân quyền</Link></Button>
            <Button asChild><Link to="/admin/classes"><Plus /> Thêm lớp</Link></Button>
          </>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={School} label="Lớp học" value={s.counts.classes} tone="indigo" index={0}
          hint={s.classesWithoutTeacher.length ? <span className="text-amber-600">{s.classesWithoutTeacher.length} lớp chưa có GVCN</span> : 'Tất cả lớp đã có GVCN'} />
        <StatCard icon={Users} label="Giáo viên" value={s.counts.teachers} tone="violet" index={1} hint="Có tài khoản đăng nhập" />
        <StatCard icon={GraduationCap} label="Sinh viên" value={s.counts.students} tone="sky" index={2}
          hint={<>TB <b className={avgTone.text}>{s.avgCredits}</b> / 150 tín chỉ</>} />
        <StatCard icon={BookOpen} label="Môn học" value={s.counts.courses} tone="emerald" index={3} hint="Trong chương trình đào tạo" />
      </div>

      {/* Hàng 1: phân bố tín chỉ + tiến độ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          index={0}
          title="Phân bố tín chỉ sinh viên"
          description="Số sinh viên theo khoảng tín chỉ đã tích luỹ (yêu cầu 150)"
          table={{ columns: [{ key: 'range', header: 'Khoảng tín chỉ' }, { key: 'count', header: 'Số SV', align: 'right' }], rows: s.creditDistribution }}
        >
          <ColumnChart data={s.creditDistribution} xKey="range" yKey="count" name="Sinh viên" height={280} />
        </ChartCard>
        <ChartCard
          index={1}
          title="Tiến độ toàn trường"
          description="Theo ngưỡng 40% / 75% tín chỉ"
          table={{ columns: [{ key: 'name', header: 'Nhóm' }, { key: 'value', header: 'Số SV', align: 'right' }], rows: bandsToDonut(s.bands) }}
        >
          <DonutChart data={bandsToDonut(s.bands)} centerLabel="sinh viên" />
        </ChartCard>
      </div>

      {/* Hàng 2: theo lớp + đường tích luỹ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          index={2}
          title="Thống kê theo lớp"
          description={classMetric === 'count' ? 'Sĩ số từng lớp' : 'Trung bình tín chỉ mỗi sinh viên, tô màu theo ngưỡng'}
          actions={(
            <Tabs value={classMetric} onValueChange={setClassMetric}>
              <TabsList className="h-8">
                <TabsTrigger value="count" className="text-xs">Sĩ số</TabsTrigger>
                <TabsTrigger value="avg" className="text-xs">TB tín chỉ</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          table={{ columns: [{ key: 'classCode', header: 'Lớp' }, { key: 'count', header: 'Sĩ số', align: 'right' }, { key: 'avgCredits', header: 'TB TC', align: 'right' }], rows: s.studentsPerClass }}
        >
          {classMetric === 'count' ? (
            <ColumnChart key="count" data={s.studentsPerClass} xKey="classCode" yKey="count" name="Sĩ số" xLabelFormatter={(v) => v.replace('-', ' ')} />
          ) : (
            <ColumnChart key="avg" data={s.studentsPerClass} xKey="classCode" yKey="avgCredits" name="TB tín chỉ" xLabelFormatter={(v) => v.replace('-', ' ')} colorFn={(r) => creditTone(percentOf(r.avgCredits)).hex} />
          )}
        </ChartCard>
        <ChartCard
          className="lg:col-span-2"
          index={3}
          title="Tỉ lệ SV đạt mốc tín chỉ"
          description="% sinh viên đã tích luỹ ít nhất X tín chỉ"
          table={{ columns: [{ key: 'range', header: 'Khoảng' }, { key: 'count', header: 'Số SV', align: 'right' }], rows: s.creditDistribution }}
        >
          <CumulativeChart distribution={s.creditDistribution} />
        </ChartCard>
      </div>

      {/* Hàng 3: môn khó + tài khoản */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard
          index={4}
          title="Môn có tỉ lệ đạt thấp nhất"
          description="Tỉ lệ lượt học có điểm ≥ 5"
          table={{ columns: [{ key: 'courseCode', header: 'Mã' }, { key: 'name', header: 'Môn' }, { key: 'passRate', header: '% đạt', align: 'right' }], rows: s.coursePassRate }}
        >
          <HBarChart
            data={s.coursePassRate}
            labelKey="courseCode"
            valueKey="passRate"
            name="Tỉ lệ đạt"
            unit="%"
            domain={[0, 100]}
            colorFn={(r) => creditTone(r.passRate).hex}
            tooltipLabel={(l, p) => p?.[0]?.payload?.name || l}
          />
        </ChartCard>
        <ChartCard
          index={5}
          title="Tài khoản theo vai trò"
          table={{ columns: [{ key: 'name', header: 'Vai trò' }, { key: 'value', header: 'Số TK', align: 'right' }], rows: roleData }}
        >
          <DonutChart data={roleData} centerLabel="tài khoản" />
        </ChartCard>
        <ChartCard index={6} title="Trạng thái tài khoản">
          <DonutChart data={accountData} centerLabel="tài khoản" />
          <Link to="/admin/users" className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 transition hover:bg-amber-100">
            <KeyRound className="h-4 w-4 text-amber-500" />
            <span><b>{s.accounts.mustChangePassword}</b> tài khoản chưa đổi mật khẩu mặc định</span>
          </Link>
        </ChartCard>
      </div>

      {/* Lớp chưa có GVCN */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Lớp chưa có GVCN</CardTitle>
            <CardDescription>Cần gán giáo viên chủ nhiệm để giáo viên quản lý được sinh viên</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/admin/classes">Quản lý lớp</Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          {s.classesWithoutTeacher.length === 0 ? (
            <EmptyState icon={School} title="Tất cả lớp đã có giáo viên chủ nhiệm" />
          ) : (
            <ul className="divide-y border-t">
              {s.classesWithoutTeacher.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium"><span className="mr-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700">{c.classCode}</span>{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.studentCount} sinh viên · TB {c.avgCredits} tín chỉ</p>
                  </div>
                  <Button asChild size="sm" variant="outline"><Link to={`/admin/classes?edit=${c.id}`}>Gán GVCN</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
