import { RefreshCw, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ErrorState({ error, onRetry }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
        <ServerCrash className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-medium">Không tải được dữ liệu</p>
      <p className="mt-1 text-sm text-muted-foreground">{error?.message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw /> Thử lại
        </Button>
      )}
    </Card>
  );
}
