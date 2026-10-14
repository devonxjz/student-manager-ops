import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Award, ClipboardPen, GraduationCap, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { creditTone, formatDate, percentOf } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import CreditBar from '@/components/CreditBar';
import RowActions from '@/components/RowActions';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '@/components/ErrorState';
import StudentFormDialog from '@/components/StudentFormDialog';
import ChartCard from '@/components/charts/ChartCard';
import ColumnChart from '@/components/charts/ColumnChart';

const BUCKETS = [[0, 29, '0–29'], [30, 59, '30–59'], [60, 89, '60–89'], [90, 119, '90–119'], [120, 149, '120–149'], [150, Infinity, '150+']];

export default function ClassStudentsPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { data: cls, error: clsError } = useApi(`/teacher/classes/${classId}`);
  const { data: students, error, loading, reload } = useApi(`/teacher/classes/${classId}/students`);
  const [form, setForm] = useState({ open: false, initial: null });
  const [toDelete, setToDelete] = useState(null);

  const stats = useMemo(() => {
    const list = students || [];
    const credits = list.map((s) => s.earnedCredits);
    return {
      count: list.length,
      avg: credits.length ? Math.round(credits.reduce((a, b) => a + b, 0) / credits.length) : 0,
      atRisk: credits.filter((c) => percentOf(c) < 40).length,
      dist: BUCKETS.map(([min, max, range]) => ({ range, count: credits.filter((c) => c >= min && c <= max).length })),
    };
  }, [students]);

  const save = async (values) => {
    const editing = form.initial?.id;
    try {
      await api(editing ? `/teacher/classes/${classId}/students/${editing}` : `/teacher/classes/${classId}/students`, {
        method: editing ? 'PUT' : 'POST', body: values,
      });
      toast.success(editing ? 'Đã cập nhật sinh viên' : `Đã thêm sinh viên ${values.fullName}`);
      reload();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  };

  const remove = async () => {
    try {
      await api(`/teacher/classes/${classId}/students/${toDelete.id}`, { method: 'DELETE' });
      toast.success(`Đã xoá sinh viên ${toDelete.fullName}`);
      reload();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  };

  if (clsError || error) return <ErrorState error={clsError || error} onRetry={reload} />;

  const columns = [
    { key: 'studentCode', header: 'MSSV', sortable: true, cell: (r) => <span className="font-mono text-xs">{r.studentCode}</span> },
    {
      key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (r) => r.fullName.split(' ').at(-1),
      cell: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.fullName}</p>
          <p className="text-xs text-muted-foreground">{r.email || '—'}</p>
        </div>
      ),
    },
    { key: 'dateOfBirth', header: 'Ngày sinh', cell: (r) => <span className="text-muted-foreground">{formatDate(r.dateOfBirth)}</span>, headClassName: 'hidden md:table-cell', className: 'hidden md:table-cell' },
    { key: 'earnedCredits', header: 'Tín chỉ', sortable: true, cell: (r) => <CreditBar earned={r.earnedCredits} /> },
    {
      key: 'status', header: 'Tiến độ', sortValue: (r) => r.earnedCredits, sortable: true, headClassName: 'hidden lg:table-cell', className: 'hidden lg:table-cell',
      cell: (r) => { const t = creditTone(percentOf(r.earnedCredits)); return <Badge variant={t.badge}>{t.label}</Badge>; },
    },
    {
      key: 'actions', header: '', className: 'w-12 text-right',
      cell: (r) => (
        <RowActions items={[
          { label: 'Sửa', icon: Pencil, onSelect: () => setForm({ open: true, initial: r }) },
          { label: 'Nhập điểm', icon: ClipboardPen, onSelect: () => navigate(`/teacher/classes/${classId}/students/${r.id}/results`) },
          { label: 'Xoá', icon: Trash2, danger: true, separatorBefore: true, onSelect: () => setToDelete(r) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={cls ? `${cls.classCode}` : 'Đang tải…'}
        description={cls ? `${cls.name} · GVCN: ${cls.teacher?.fullName || 'Chưa phân công'}` : ' '}
        actions={<Button onClick={() => setForm({ open: true, initial: null })}><Plus /> Thêm sinh viên</Button>}
      >
        <Link to="/teacher/classes" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Danh sách lớp
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-1 lg:grid-cols-1">
          <StatCard icon={GraduationCap} label="Sĩ số" value={stats.count} tone="sky" index={0} />
          <StatCard icon={Award} label="TB tín chỉ" value={stats.avg} suffix="/ 150" tone="indigo" index={1} />
          <StatCard icon={TriangleAlert} label="Chậm tiến độ" value={stats.atRisk} tone={stats.atRisk ? 'rose' : 'emerald'} index={2} hint="Dưới 40% tín chỉ" />
        </div>
        <ChartCard
          className="lg:col-span-2"
          title="Phân bố tín chỉ trong lớp"
          description="Số sinh viên theo khoảng tín chỉ"
          table={{ columns: [{ key: 'range', header: 'Khoảng' }, { key: 'count', header: 'Số SV', align: 'right' }], rows: stats.dist }}
        >
          <ColumnChart data={stats.dist} xKey="range" yKey="count" name="Sinh viên" height={300} />
        </ChartCard>
      </div>

      <div className="mt-6">
        <DataTable
          testId="students-table"
          columns={columns}
          data={students}
          loading={loading}
          searchKeys={['studentCode', 'fullName', 'email']}
          searchPlaceholder="Tìm theo MSSV, tên, email…"
          emptyTitle="Lớp chưa có sinh viên"
          emptyDescription="Nhấn “Thêm sinh viên” để bắt đầu."
        />
      </div>

      <StudentFormDialog open={form.open} onOpenChange={(open) => setForm((f) => ({ ...f, open }))} initial={form.initial} onSubmit={save} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Xoá sinh viên?"
        description={toDelete && `Sinh viên ${toDelete.fullName} (${toDelete.studentCode}) cùng tài khoản và toàn bộ kết quả học tập sẽ bị xoá vĩnh viễn.`}
        confirmText="Xoá sinh viên"
        onConfirm={remove}
      />
    </>
  );
}
