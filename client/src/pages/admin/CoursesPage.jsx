import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { BookOpen, Layers, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import RowActions from '@/components/RowActions';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '@/components/ErrorState';
import FormField from '@/components/FormField';
import StatCard from '@/components/StatCard';

const schema = z.object({
  courseCode: z.string().trim().min(2, 'Nhập mã môn').max(20).regex(/^[A-Za-z0-9]+$/, 'Chỉ gồm chữ và số'),
  name: z.string().trim().min(2, 'Nhập tên môn').max(150),
  credits: z.coerce.number({ invalid_type_error: 'Nhập số tín chỉ' }).int('Số nguyên').min(1, 'Tối thiểu 1').max(10, 'Tối đa 10'),
});

function CourseFormDialog({ open, onOpenChange, initial, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  useEffect(() => { if (open) reset({ courseCode: initial?.courseCode || '', name: initial?.name || '', credits: initial?.credits ?? 3 }); }, [open, initial, reset]);
  const submit = async (v) => { try { await onSubmit(v); onOpenChange(false); } catch { /* đã toast */ } };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Sửa môn học' : 'Thêm môn học'}</DialogTitle>
          <DialogDescription>Số tín chỉ dùng để tính tiến độ khi sinh viên đạt điểm ≥ 5.</DialogDescription>
        </DialogHeader>
        <form id="course-form" onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <FormField id="courseCode" label="Mã môn" error={errors.courseCode}>
                <Input id="courseCode" placeholder="SE110" aria-invalid={!!errors.courseCode} {...register('courseCode')} />
              </FormField>
            </div>
            <FormField id="credits" label="Số tín chỉ" error={errors.credits}>
              <Input id="credits" type="number" min={1} max={10} aria-invalid={!!errors.credits} {...register('credits')} />
            </FormField>
          </div>
          <FormField id="name" label="Tên môn học" error={errors.name}>
            <Input id="name" placeholder="Lập trình Node.js" aria-invalid={!!errors.name} {...register('name')} />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="course-form" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" />} {initial?.id ? 'Lưu thay đổi' : 'Thêm môn học'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CoursesPage() {
  const { data, error, loading, reload } = useApi('/admin/courses');
  const [form, setForm] = useState({ open: false, initial: null });
  const [toDelete, setToDelete] = useState(null);
  const totalCredits = useMemo(() => (data || []).reduce((s, c) => s + c.credits, 0), [data]);

  const save = async (values) => {
    const id = form.initial?.id;
    try {
      await api(id ? `/admin/courses/${id}` : '/admin/courses', { method: id ? 'PUT' : 'POST', body: values });
      toast.success(id ? 'Đã cập nhật môn học' : `Đã thêm môn ${values.courseCode}`);
      reload();
    } catch (e) { toast.error(e.message); throw e; }
  };
  const remove = async () => {
    try {
      await api(`/admin/courses/${toDelete.id}`, { method: 'DELETE' });
      toast.success(`Đã xoá môn ${toDelete.courseCode}`);
      reload();
    } catch (e) { toast.error(e.message); throw e; }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const columns = [
    { key: 'courseCode', header: 'Mã môn', sortable: true, cell: (r) => <span className="font-mono text-xs">{r.courseCode}</span> },
    { key: 'name', header: 'Tên môn', sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: 'credits', header: 'Tín chỉ', sortable: true,
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="flex gap-0.5">{Array.from({ length: Math.min(r.credits, 6) }).map((_, i) => <span key={i} className="h-3 w-1.5 rounded-sm bg-indigo-400" />)}</span>
          <span className="tabular text-sm font-medium">{r.credits}</span>
        </span>
      ),
    },
    { key: 'enrolled', header: 'Lượt học', sortable: true, className: 'tabular text-muted-foreground hidden md:table-cell', headClassName: 'hidden md:table-cell', cell: (r) => r.enrolled },
    {
      key: 'actions', header: '', className: 'w-12 text-right', cell: (r) => (
        <RowActions items={[
          { label: 'Sửa', icon: Pencil, onSelect: () => setForm({ open: true, initial: r }) },
          { label: 'Xoá', icon: Trash2, danger: true, separatorBefore: true, onSelect: () => setToDelete(r) },
        ]} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Môn học" description="Danh mục môn học và số tín chỉ."
        actions={<Button onClick={() => setForm({ open: true, initial: null })}><Plus /> Thêm môn học</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard icon={BookOpen} label="Số môn học" value={data?.length ?? 0} tone="emerald" />
        <StatCard icon={Layers} label="Tổng tín chỉ chương trình" value={totalCredits} tone="indigo" index={1} hint="Sinh viên cần tích luỹ 150 tín chỉ để tốt nghiệp" />
      </div>
      <DataTable testId="courses-table" columns={columns} data={data} loading={loading} searchKeys={['courseCode', 'name']} searchPlaceholder="Tìm mã, tên môn…" emptyTitle="Chưa có môn học" />
      <CourseFormDialog open={form.open} onOpenChange={(open) => setForm((f) => ({ ...f, open }))} initial={form.initial} onSubmit={save} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Xoá môn học?"
        description={toDelete && (toDelete.enrolled > 0
          ? `Môn ${toDelete.courseCode} · ${toDelete.name} đã có ${toDelete.enrolled} kết quả học tập nên hệ thống sẽ không cho xoá (để không mất điểm của sinh viên). Hãy xoá các kết quả đó trước.`
          : `Môn ${toDelete.courseCode} · ${toDelete.name} chưa có kết quả học tập nào và sẽ bị xoá vĩnh viễn.`)} confirmText="Xoá môn học" onConfirm={remove} />
    </>
  );
}
