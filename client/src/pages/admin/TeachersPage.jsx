import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { initials } from '@/lib/format';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import RowActions from '@/components/RowActions';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '@/components/ErrorState';
import FormField from '@/components/FormField';

const schema = z.object({
  teacherCode: z.string().trim().min(2, 'Nhập mã GV').max(20).regex(/^[A-Za-z0-9]+$/, 'Chỉ gồm chữ và số'),
  fullName: z.string().trim().min(2, 'Nhập họ tên').max(100),
  email: z.string().trim().email('Email không hợp lệ').or(z.literal('')),
});

function TeacherFormDialog({ open, onOpenChange, initial, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  useEffect(() => { if (open) reset({ teacherCode: initial?.teacherCode || '', fullName: initial?.fullName || '', email: initial?.email || '' }); }, [open, initial, reset]);
  const submit = async (v) => { try { await onSubmit(v); onOpenChange(false); } catch { /* đã toast */ } };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Sửa giáo viên' : 'Thêm giáo viên'}</DialogTitle>
          <DialogDescription>{initial?.id ? 'Cập nhật hồ sơ giáo viên.' : 'Tạo kèm tài khoản: tên đăng nhập và mật khẩu ban đầu là mã GV.'}</DialogDescription>
        </DialogHeader>
        <form id="teacher-form" onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <FormField id="teacherCode" label="Mã giáo viên" error={errors.teacherCode}>
            <Input id="teacherCode" placeholder="GV007" aria-invalid={!!errors.teacherCode} {...register('teacherCode')} />
          </FormField>
          <FormField id="fullName" label="Họ và tên" error={errors.fullName}>
            <Input id="fullName" placeholder="Nguyễn Văn B" aria-invalid={!!errors.fullName} {...register('fullName')} />
          </FormField>
          <FormField id="email" label="Email" error={errors.email}>
            <Input id="email" type="email" placeholder="gv@school.edu.vn" aria-invalid={!!errors.email} {...register('email')} />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="teacher-form" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" />} {initial?.id ? 'Lưu thay đổi' : 'Thêm giáo viên'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TeachersPage() {
  const { data, error, loading, reload } = useApi('/admin/teachers');
  const [form, setForm] = useState({ open: false, initial: null });
  const [toDelete, setToDelete] = useState(null);

  const save = async (values) => {
    const id = form.initial?.id;
    try {
      await api(id ? `/admin/teachers/${id}` : '/admin/teachers', { method: id ? 'PUT' : 'POST', body: values });
      toast.success(id ? 'Đã cập nhật giáo viên' : `Đã thêm giáo viên ${values.fullName}`);
      reload();
    } catch (e) { toast.error(e.message); throw e; }
  };
  const remove = async () => {
    try {
      await api(`/admin/teachers/${toDelete.id}`, { method: 'DELETE' });
      toast.success(`Đã xoá giáo viên ${toDelete.fullName}`);
      reload();
    } catch (e) { toast.error(e.message); throw e; }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const columns = [
    {
      key: 'fullName', header: 'Giáo viên', sortable: true, sortValue: (r) => r.fullName.split(' ').at(-1),
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8"><AvatarFallback className="bg-violet-100 text-violet-700">{initials(r.fullName)}</AvatarFallback></Avatar>
          <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.email || '—'}</p></div>
        </div>
      ),
    },
    { key: 'teacherCode', header: 'Mã GV', sortable: true, cell: (r) => <span className="font-mono text-xs">{r.teacherCode}</span> },
    {
      key: 'classes', header: 'Lớp chủ nhiệm', sortable: true, sortValue: (r) => r.classes.length,
      cell: (r) => (r.classes.length ? (
        <div className="flex flex-wrap gap-1">{r.classes.map((c) => <Badge key={c.id} variant="secondary">{c.classCode}</Badge>)}</div>
      ) : <span className="text-xs text-muted-foreground">Chưa chủ nhiệm</span>),
    },
    { key: 'isActive', header: 'Tài khoản', cell: (r) => (r.isActive ? <Badge variant="success">Hoạt động</Badge> : <Badge variant="destructive">Bị khoá</Badge>), headClassName: 'hidden md:table-cell', className: 'hidden md:table-cell' },
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
      <PageHeader title="Giáo viên" description="Quản lý giáo viên và tài khoản đăng nhập."
        actions={<Button onClick={() => setForm({ open: true, initial: null })}><Plus /> Thêm giáo viên</Button>} />
      <DataTable testId="teachers-table" columns={columns} data={data} loading={loading} searchKeys={['teacherCode', 'fullName', 'email']} searchPlaceholder="Tìm mã, tên, email…" emptyTitle="Chưa có giáo viên" />
      <TeacherFormDialog open={form.open} onOpenChange={(open) => setForm((f) => ({ ...f, open }))} initial={form.initial} onSubmit={save} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Xoá giáo viên?"
        description={toDelete && `${toDelete.fullName} và tài khoản đăng nhập sẽ bị xoá. Các lớp đang chủ nhiệm sẽ chuyển về “Chưa phân công”.`} confirmText="Xoá giáo viên" onConfirm={remove} />
    </>
  );
}
