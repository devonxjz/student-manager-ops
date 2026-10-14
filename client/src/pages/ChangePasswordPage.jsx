import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import FormField from '@/components/FormField';
import PageHeader from '@/components/PageHeader';

const schema = z.object({
  currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ['newPassword'], message: 'Mật khẩu mới phải khác mật khẩu cũ' });

const RULES = [
  [(v) => v.length >= 6, 'Ít nhất 6 ký tự'],
  [(v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Có cả chữ và số'],
  [(v) => v.length >= 10, 'Từ 10 ký tự trở lên (khuyến nghị)'],
];

export default function ChangePasswordPage() {
  const { refresh } = useAuth();
  const { register, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const pw = watch('newPassword') || '';
  const strength = RULES.filter(([fn]) => fn(pw)).length;

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await api('/auth/password', { method: 'PUT', body: { currentPassword, newPassword } });
      toast.success('Đã đổi mật khẩu');
      reset();
      refresh();
    } catch (e) {
      if (e.status === 400) setError('currentPassword', { message: e.message });
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="Đổi mật khẩu" description="Dùng mật khẩu mạnh và không chia sẻ cho người khác." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Mật khẩu mới</CardTitle>
            <CardDescription>Sau khi đổi, phiên đăng nhập hiện tại vẫn được giữ.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
              <FormField id="currentPassword" label="Mật khẩu hiện tại" error={errors.currentPassword}>
                <Input id="currentPassword" type="password" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...register('currentPassword')} />
              </FormField>
              <FormField id="newPassword" label="Mật khẩu mới" error={errors.newPassword}>
                <Input id="newPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.newPassword} {...register('newPassword')} />
              </FormField>
              <div className="flex gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < strength ? ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'][strength - 1] : 'bg-slate-200')} />
                ))}
              </div>
              <FormField id="confirmPassword" label="Nhập lại mật khẩu mới" error={errors.confirmPassword}>
                <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
              </FormField>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />} Cập nhật mật khẩu
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Gợi ý</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {RULES.map(([fn, label]) => (
                <li key={label} className={cn('flex items-center gap-2 text-sm transition-colors', fn(pw) ? 'text-emerald-700' : 'text-muted-foreground')}>
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded-full', fn(pw) ? 'bg-emerald-500 text-white' : 'bg-slate-200')}>
                    {fn(pw) && <Check className="h-3 w-3" />}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
