import { Label } from '@/components/ui/label';

/** Nhãn + ô nhập + thông báo lỗi từ react-hook-form/zod. */
export default function FormField({ id, label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-rose-600">{error.message}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
