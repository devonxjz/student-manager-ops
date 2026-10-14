import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import CreditBar from '@/components/CreditBar';
import RowActions from '@/components/RowActions';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '@/components/ErrorState';
import FormField from '@/components/FormField';

const NONE = 'none';
const schema = z.object({
  classCode: z.string().trim().min(2, 'Nhập mã lớp').max(20).regex(/^[A-Za-z0-9-]+$/, 'Chỉ gồm chữ, số và dấu -'),
  name: z.string().trim().min(2, 'Nhập tên lớp').max(100),
  intakeYear: z.coerce.number({ invalid_type_error: 'Nhập năm nhập học' }).int('Số nguyên').min(2000, 'Từ 2000').max(2100, 'Đến 2100'),
  teacherId: z.string(),
});

function ClassFormDialog({ open, onOpenChange, initial, teachers, onSubmit }) {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  useEffect(() => {
    if (open) reset({ classCode: initial?.classCode || '', name: initial?.name || '', intakeYear: initial?.intakeYear ?? new Date().getFullYear(), teacherId: initial?.teacherId ? String(initial.teacherId) : NONE });
  }, [open, initial, reset]);
  const submit = async (v) => {
    try {
      await onSubmit({ classCode: v.classCode, name: v.name, intakeYear: v.intakeYear, teacherId: v.teacherId === NONE ? null : Number(v.teacherId) });
      onOpenChange(false);
    } catch { /* đã toast */ }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Sửa lớp' : 'Thêm lớp'}</DialogTitle>
          <DialogDescription>Mỗi lớp có tối đa một giáo viên chủ nhiệm.</DialogDescription>
        </DialogHeader>
        <form id="class-form" onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <FormField id="classCode" label="Mã lớp" error={errors.classCode}>
            <Input id="classCode" placeholder="CNTT-K24A" aria-invalid={!!errors.classCode} {...register('classCode')} />
          </FormField>
          <FormField id="name" label="Tên lớp" error={errors.name}>
            <Input id="name" placeholder="Công nghệ thông tin K24 - A" aria-invalid={!!errors.name} {...register('name')} />
          </FormField>
          <FormField id="intakeYear" label="Khoá (năm nhập học)" error={errors.intakeYear}>
            <Input id="intakeYear" type="number" min={2000} max={2100} aria-invalid={!!errors.intakeYear} {...register('intakeYear')} />
          </FormField>
          <FormField id="teacherId" label="Giáo viên chủ nhiệm">
            <Controller control={control} name="teacherId" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="teacherId"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— Chưa phân công —</SelectItem>
                  {teachers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.teacherCode} · {t.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="class-form" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" />} {initial?.id ? 'Lưu thay đổi' : 'Thêm lớp'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassesPage() {
  const { data, error, loading, reload } = useApi('/admin/classes');
  const { data: teachers } = useApi('/admin/teachers');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({ open: false, initial: null });
  const [toDelete, setToDelete] = useState(null);

  // Mở sẵn form sửa khi đi từ dashboard: /admin/classes?edit=7
  useEffect(() => {
    const id = Number(params.get('edit'));
    if (id && data) {
      const c = data.find((x) => x.id === id);
      if (c) setForm({ open: true, initial: c });
      setParams({}, { replace: true });
    }
  }, [params, data, setParams]);

  const save = async (values) => {
    const id = form.initial?.id;
    try {
      await api(id ? `/admin/classes/${id}` : '/admin/classes', { method: id ? 'PUT' : 'POST', body: values });
      toast.success(id ? 'Đã cập nhật lớp' : `Đã thêm lớp ${values.classCode}`);
      reload();
    } catch (e) { toast.error(e.message); throw e; }
  };
  const remove = async () => {
    try {
      await api(`/admin/classes/${toDelete.id}`, { method: 'DELETE' });
      toast.success(`Đã xoá lớp ${toDelete.classCode}`);
      reload();
    } catch (e) { toast.error(e.message); throw e; }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const columns = [
    { key: 'classCode', header: 'Mã lớp', sortable: true, cell: (r) => <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">{r.classCode}</span> },
    { key: 'name', header: 'Tên lớp', sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'intakeYear', header: 'Khoá', sortable: true, className: 'tabular text-muted-foreground', headClassName: 'hidden md:table-cell', cell: (r) => r.intakeYear ?? '—' },
    { key: 'teacher', header: 'GV chủ nhiệm', sortable: true, sortValue: (r) => r.teacher?.fullName || '', cell: (r) => (r.teacher ? r.teacher.fullName : <Badge variant="warning">Chưa phân công</Badge>) },
    { key: 'studentCount', header: 'Sĩ số', sortable: true, className: 'tabular', cell: (r) => r.studentCount },
    { key: 'avgCredits', header: 'TB tín chỉ', sortable: true, cell: (r) => <CreditBar earned={r.avgCredits} />, headClassName: 'hidden lg:table-cell', className: 'hidden lg:table-cell' },
    {
      key: 'actions', header: '', className: 'w-12 text-right', cell: (r) => (
        <RowActions items={[
          { label: 'Sửa / gán GVCN', icon: Pencil, onSelect: () => setForm({ open: true, initial: r }) },
          { label: 'Xem sinh viên', icon: Eye, onSelect: () => navigate(`/teacher/classes/${r.id}`) },
          { label: 'Xoá', icon: Trash2, danger: true, separatorBefore: true, onSelect: () => setToDelete(r) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Lớp học" description="Quản lý lớp và gán giáo viên chủ nhiệm."
        actions={<Button onClick={() => setForm({ open: true, initial: null })}><Plus /> Thêm lớp</Button>} />
      <DataTable
        testId="classes-table"
        columns={columns}
        data={data}
        loading={loading}
        searchKeys={['classCode', 'name', (r) => r.teacher?.fullName]}
        searchPlaceholder="Tìm mã lớp, tên lớp, GVCN…"
        emptyTitle="Chưa có lớp nào"
        toolbar={<span className="text-xs text-muted-foreground">Xem sinh viên từng lớp tại <Link to="/teacher/classes" className="font-medium text-primary hover:underline">Nhập điểm theo lớp</Link></span>}
      />
      <ClassFormDialog open={form.open} onOpenChange={(open) => setForm((f) => ({ ...f, open }))} initial={form.initial} teachers={teachers || []} onSubmit={save} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Xoá lớp?"
        description={toDelete && `Lớp ${toDelete.classCode} sẽ bị xoá. Chỉ xoá được khi lớp không còn sinh viên.`} confirmText="Xoá lớp" onConfirm={remove} />
    </>
  );
}
