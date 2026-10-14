import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardPen, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { creditTone, percentOf } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import CreditBar from '@/components/CreditBar';
import RowActions from '@/components/RowActions';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '@/components/ErrorState';
import StudentFormDialog from '@/components/StudentFormDialog';

const ALL = 'all';
const BANDS = { good: 'Đúng tiến độ', warning: 'Cần chú ý', danger: 'Chậm tiến độ' };

export default function StudentsPage() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi('/admin/students');
  const { data: classes } = useApi('/admin/classes');
  const [classFilter, setClassFilter] = useState(ALL);
  const [bandFilter, setBandFilter] = useState(ALL);
  const [form, setForm] = useState({ open: false, initial: null });
  const [toDelete, setToDelete] = useState(null);

  const save = async (values) => {
    const id = form.initial?.id;
    try {
      await api(id ? `/admin/students/${id}` : '/admin/students', { method: id ? 'PUT' : 'POST', body: values });
      toast.success(id ? (form.initial.classId !== values.classId ? 'Đã cập nhật và chuyển lớp' : 'Đã cập nhật sinh viên') : `Đã thêm sinh viên ${values.fullName}`);
      reload();
    } catch (e) { toast.error(e.message); throw e; }
  };
  const remove = async () => {
    try {
      await api(`/admin/students/${toDelete.id}`, { method: 'DELETE' });
      toast.success(`Đã xoá sinh viên ${toDelete.fullName}`);
      reload();
    } catch (e) { toast.error(e.message); throw e; }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const filter = (r) => (classFilter === ALL || String(r.classId) === classFilter)
    && (bandFilter === ALL || creditTone(percentOf(r.earnedCredits)).key === bandFilter);

  const columns = [
    { key: 'studentCode', header: 'MSSV', sortable: true, cell: (r) => <span className="font-mono text-xs">{r.studentCode}</span> },
    {
      key: 'fullName', header: 'Họ tên', sortable: true, sortValue: (r) => r.fullName.split(' ').at(-1),
      cell: (r) => <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.email || '—'}</p></div>,
    },
    { key: 'class', header: 'Lớp', sortable: true, sortValue: (r) => r.class?.classCode, cell: (r) => <Badge variant="secondary">{r.class?.classCode || '—'}</Badge> },
    { key: 'earnedCredits', header: 'Tín chỉ', sortable: true, cell: (r) => <CreditBar earned={r.earnedCredits} /> },
    { key: 'isActive', header: 'Tài khoản', cell: (r) => (r.isActive ? <Badge variant="success">Hoạt động</Badge> : <Badge variant="destructive">Bị khoá</Badge>), headClassName: 'hidden xl:table-cell', className: 'hidden xl:table-cell' },
    {
      key: 'actions', header: '', className: 'w-12 text-right', cell: (r) => (
        <RowActions items={[
          { label: 'Sửa / chuyển lớp', icon: Pencil, onSelect: () => setForm({ open: true, initial: r }) },
          { label: 'Nhập điểm', icon: ClipboardPen, onSelect: () => navigate(`/teacher/classes/${r.classId}/students/${r.id}/results`) },
          { label: 'Xoá', icon: Trash2, danger: true, separatorBefore: true, onSelect: () => setToDelete(r) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Sinh viên" description="Quản lý sinh viên toàn trường, chuyển lớp, theo dõi tín chỉ."
        actions={<Button onClick={() => setForm({ open: true, initial: null })}><Plus /> Thêm sinh viên</Button>} />
      <DataTable
        testId="admin-students-table"
        columns={columns}
        data={data}
        loading={loading}
        filter={filter}
        searchKeys={['studentCode', 'fullName', 'email']}
        searchPlaceholder="Tìm MSSV, tên, email…"
        emptyTitle="Không có sinh viên"
        toolbar={(
          <>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-9 w-40" aria-label="Lọc theo lớp"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả lớp</SelectItem>
                {(classes || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.classCode}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={bandFilter} onValueChange={setBandFilter}>
              <SelectTrigger className="h-9 w-40" aria-label="Lọc theo tiến độ"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Mọi tiến độ</SelectItem>
                {Object.entries(BANDS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}
      />
      <StudentFormDialog open={form.open} onOpenChange={(open) => setForm((f) => ({ ...f, open }))} initial={form.initial} classes={classes || []} onSubmit={save} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Xoá sinh viên?"
        description={toDelete && `${toDelete.fullName} (${toDelete.studentCode}) cùng tài khoản và kết quả học tập sẽ bị xoá vĩnh viễn.`} confirmText="Xoá sinh viên" onConfirm={remove} />
    </>
  );
}
