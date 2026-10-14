import { motion } from 'framer-motion';
import { CalendarDays, Hash, KeyRound, Mail, School, UserRound, BookUser } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatDate, initials } from '@/lib/format';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/PageHeader';
import RoleBadge from '@/components/RoleBadge';

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-0.5 truncate text-sm font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const p = user.profile || {};
  return (
    <>
      <PageHeader title="Thông tin cá nhân" description="Thông tin do nhà trường quản lý. Cần chỉnh sửa, vui lòng liên hệ giáo viên chủ nhiệm." />
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-500" />
            <CardContent className="-mt-10 flex flex-col items-center pb-6 text-center">
              <Avatar className="h-20 w-20 ring-4 ring-white"><AvatarFallback className="bg-sky-100 text-xl text-sky-700">{initials(p.fullName)}</AvatarFallback></Avatar>
              <p className="mt-3 text-lg font-semibold">{p.fullName}</p>
              <p className="font-mono text-sm text-muted-foreground">{p.studentCode}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <RoleBadge role={user.role} />
                {user.isActive ? <Badge variant="success">Đang hoạt động</Badge> : <Badge variant="destructive">Bị khoá</Badge>}
              </div>
              <Button asChild variant="outline" size="sm" className="mt-5"><Link to="/password"><KeyRound /> Đổi mật khẩu</Link></Button>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Hồ sơ sinh viên</CardTitle></CardHeader>
            <CardContent className="grid divide-y sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
              <InfoRow icon={UserRound} label="Họ và tên" value={p.fullName} />
              <InfoRow icon={Hash} label="Mã số sinh viên" value={p.studentCode} mono />
              <InfoRow icon={CalendarDays} label="Ngày sinh" value={formatDate(p.dateOfBirth)} />
              <InfoRow icon={Mail} label="Email" value={p.email} />
              <InfoRow icon={UserRound} label="Tên đăng nhập" value={user.username} mono />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Lớp & chủ nhiệm</CardTitle></CardHeader>
            <CardContent className="grid divide-y sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
              <InfoRow icon={School} label="Lớp" value={p.class ? `${p.class.classCode} · ${p.class.name}` : null} />
              <InfoRow icon={BookUser} label="Giáo viên chủ nhiệm" value={p.homeroomTeacher?.fullName || 'Chưa phân công'} />
              <InfoRow icon={Mail} label="Email giáo viên" value={p.homeroomTeacher?.email} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
