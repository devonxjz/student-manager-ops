import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormField from '@/components/FormField';

const base = {
  studentCode: z.string().trim().min(4, 'MSSV tối thiểu 4 ký tự').max(20, 'Tối đa 20 ký tự').regex(/^[A-Za-z0-9]+$/, 'Chỉ gồm chữ và số'),
  fullName: z.string().trim().min(2, 'Nhập họ tên').max(100),
  dateOfBirth: z.string().optional().or(z.literal('')),
  email: z.string().trim().email('Email không hợp lệ').optional().or(z.literal('')),
};

/**
 * Form thêm / sửa sinh viên. Truyền `classes` để hiện ô chọn lớp (trang admin).
 * onSubmit(values) trả Promise; ném lỗi để giữ dialog mở.
 */
export default function StudentFormDialog({ open, onOpenChange, initial, classes, onSubmit }) {
  const schema = z.object(classes ? { ...base, classId: z.string().min(1, 'Chọn lớp') } : base);
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const editing = !!initial?.id;

  useEffect(() => {
    if (open) {
      reset({
        studentCode: initial?.studentCode || '', fullName: initial?.fullName || '',
        dateOfBirth: initial?.dateOfBirth || '', email: initial?.email || '',
        ...(classes ? { classId: initial?.classId ? String(initial.classId) : '' } : {}),
      });
    }
  }, [open, initial, reset, classes]);

  const submit = async (values) => {
    try {
      await onSubmit({ ...values, ...(values.classId ? { classId: Number(values.classId) } : {}) });
      onOpenChange(false);
    } catch { /* toast ở nơi gọi */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Sửa thông tin sinh viên' : 'Thêm sinh viên'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Cập nhật hồ sơ sinh viên.' : 'Hệ thống tự tạo tài khoản: tên đăng nhập và mật khẩu ban đầu là MSSV.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate id="student-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="studentCode" label="MSSV" error={errors.studentCode}>
              <Input id="studentCode" placeholder="20520199" aria-invalid={!!errors.studentCode} {...register('studentCode')} />
            </FormField>
            <FormField id="dateOfBirth" label="Ngày sinh" error={errors.dateOfBirth}>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            </FormField>
          </div>
          <FormField id="fullName" label="Họ và tên" error={errors.fullName}>
            <Input id="fullName" placeholder="Nguyễn Văn A" aria-invalid={!!errors.fullName} {...register('fullName')} />
          </FormField>
          <FormField id="email" label="Email" error={errors.email}>
            <Input id="email" type="email" placeholder="sv@student.edu.vn" aria-invalid={!!errors.email} {...register('email')} />
          </FormField>
          {classes && (
            <FormField id="classId" label="Lớp" error={errors.classId} hint={editing ? 'Đổi lớp để chuyển sinh viên sang lớp khác.' : undefined}>
              <Controller
                control={control}
                name="classId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="classId" aria-invalid={!!errors.classId}><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.classCode} · {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Huỷ</Button>
          <Button type="submit" form="student-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />} {editing ? 'Lưu thay đổi' : 'Thêm sinh viên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
