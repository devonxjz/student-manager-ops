import { useState } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

/** Hộp xác nhận màu rose cho thao tác nguy hiểm. onConfirm có thể trả Promise. */
export default function ConfirmDialog({ open, onOpenChange, title, description, confirmText = 'Xoá', onConfirm }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
      onOpenChange(false);
    } catch {
      /* lỗi đã được toast ở nơi gọi */
    } finally {
      setBusy(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <TriangleAlert className="h-5 w-5" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Huỷ</AlertDialogCancel>
          <Button variant="destructive" onClick={handle} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
