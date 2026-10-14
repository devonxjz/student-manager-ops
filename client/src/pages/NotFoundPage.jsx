import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 text-center">
      <div className="bg-grid mask-fade-b absolute inset-0 -z-10" />
      <Logo />
      <p className="mt-10 text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted-foreground">Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.</p>
      <Button asChild className="mt-8"><Link to="/"><ArrowLeft /> Về trang chủ</Link></Button>
    </div>
  );
}
