import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Lock, RotateCcw, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { formatDate, initials, ROLE_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '@/components/ErrorState';
import RoleBadge from '@/components/RoleBadge';
import StatCard from '@/components/StatCard';

const ROLE_HINT = {
  teacher: 'Sẽ tạo hồ sơ giáo viên tương ứng.',
  student: 'Sẽ tạo hồ sơ sinh viên, hãy chọn lớp bên dưới.',
  admin: 'Toàn quyền quản trị hệ thống.',
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const { data, error, loading, reload, setData } = useApi('/admin/users');
  const [roleTab, setRoleTab] = useState('all');
  const { data: classes } = useApi('/admin/classes');
  const [pendingRole, setPendingRole] = useState(null); // { user, role }
  const [pendingClassId, setPendingClassId] = useState(''); // chỉ dùng khi đổi sang sinh viên (students.class_id bắt buộc)
  const [toReset, setToReset] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const counts = useMemo(() => {
    const list = data || [];
    return { all: list.length, active: list.filter((u) => u.isActive).length, locked: list.filter((u) => !u.isActive).length, mustChange: list.filter((u) => u.mustChangePassword).length };
  }, [data]);

  const patchRow = (row) => setData((list) => list.map((u) => (u.id === row.id ? { ...u, ...row } : u)));

  const askRole = (user, role) => {
    setPendingClassId(classes?.[0] ? String(classes[0].id) : '');
    setPendingRole({ user, role });
  };

  const changeRole = async () => {
    const { user, role } = pendingRole;
    try {
      if (role === 'student' && !pendingClassId) throw new Error('Chưa có lớp nào, hãy tạo lớp trước khi chuyển thành sinh viên');
      const body = role === 'student' ? { role, classId: Number(pendingClassId) } : { role };
      const row = await api(`/admin/users/${user.id}/role`, { method: 'PATCH', body });
      patchRow(row);
      toast.success(`Đã đổi ${user.username} thành ${ROLE_LABEL[role]}`);
    } catch (e) { toast.error(e.message); throw e; }
  };

  const toggleStatus = async (u, isActive) => {
    setBusyId(u.id);
    patchRow({ id: u.id, isActive }); // cập nhật lạc quan
    try {
      await api(`/admin/users/${u.id}/status`, { method: 'PATCH', body: { isActive } });
      toast.success(isActive ? `Đã mở khoá ${u.username}` : `Đã khoá ${u.username}`);
    } catch (e) {
      patchRow({ id: u.id, isActive: !isActive });
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async () => {
    try {
      const res = await api(`/admin/users/${toReset.id}/reset-password`, { method: 'POST' });
      patchRow({ id: toReset.id, mustChangePassword: true });
      toast.success(res?.message || 'Đã đặt lại mật khẩu');
    } catch (e) { toast.error(e.message); throw e; }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const columns = [
    {
      key: 'fullName', header: 'Người dùng', sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8"><AvatarFallback>{initials(u.fullName)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-medium">{u.fullName}{u.id === me.id && <Badge variant="outline" className="text-[10px]">Bạn</Badge>}</p>
            <p className="font-mono text-xs text-muted-foreground">@{u.username}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Vai trò', sortable: true, cell: (u) => <RoleBadge role={u.role} /> },
    {
      key: 'changeRole', header: 'Cấp quyền',
      cell: (u) => (
        <Select value={u.role} onValueChange={(role) => role !== u.role && askRole(u, role)} disabled={u.id === me.id}>
          <SelectTrigger className="h-8 w-32" aria-label={`Đổi vai trò ${u.username}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'isActive', header: 'Trạng thái', sortable: true, sortValue: (u) => (u.isActive ? 1 : 0),
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <Switch checked={u.isActive} onCheckedChange={(v) => toggleStatus(u, v)} disabled={u.id === me.id || busyId === u.id} aria-label={u.isActive ? `Khoá ${u.username}` : `Mở khoá ${u.username}`} />
          <span className={cn('text-xs font-medium', u.isActive ? 'text-emerald-700' : 'text-rose-600')}>{u.isActive ? 'Hoạt động' : 'Bị khoá'}</span>
        </div>
      ),
    },
    {
      key: 'mustChangePassword', header: 'Mật khẩu', headClassName: 'hidden lg:table-cell', className: 'hidden lg:table-cell',
      cell: (u) => (u.mustChangePassword ? <Badge variant="warning"><KeyRound className="h-3 w-3" /> Chưa đổi MK</Badge> : <span className="text-xs text-muted-foreground">Đã đổi</span>),
    },
    { key: 'createdAt', header: 'Ngày tạo', sortable: true, headClassName: 'hidden xl:table-cell', className: 'hidden xl:table-cell text-muted-foreground', cell: (u) => formatDate(u.createdAt) },
    {
      key: 'actions', header: '', className: 'w-12 text-right',
      cell: (u) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setToReset(u)} aria-label={`Đặt lại mật khẩu ${u.username}`}><RotateCcw /></Button>
          </TooltipTrigger>
          <TooltipContent>Đặt lại mật khẩu</TooltipContent>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Phân quyền" description="Đổi vai trò, khoá / mở tài khoản và đặt lại mật khẩu." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Tổng tài khoản" value={counts.all} tone="indigo" index={0} />
        <StatCard icon={UserCheck} label="Đang hoạt động" value={counts.active} tone="emerald" index={1} />
        <StatCard icon={Lock} label="Bị khoá" value={counts.locked} tone="rose" index={2} />
        <StatCard icon={KeyRound} label="Chưa đổi mật khẩu" value={counts.mustChange} tone="amber" index={3} />
      </div>
      <DataTable
        testId="users-table"
        columns={columns}
        data={data}
        loading={loading}
        filter={roleTab === 'all' ? undefined : (u) => u.role === roleTab}
        searchKeys={['username', 'fullName']}
        searchPlaceholder="Tìm tên đăng nhập, họ tên…"
        toolbar={(
          <Tabs value={roleTab} onValueChange={setRoleTab}>
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="admin">Quản trị</TabsTrigger>
              <TabsTrigger value="teacher">Giáo viên</TabsTrigger>
              <TabsTrigger value="student">Sinh viên</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      />

      <ConfirmDialog
        open={!!pendingRole}
        onOpenChange={(o) => !o && setPendingRole(null)}
        title="Đổi vai trò tài khoản?"
        description={pendingRole && (
          <>
            <span className="font-medium text-foreground">@{pendingRole.user.username}</span> sẽ chuyển từ {ROLE_LABEL[pendingRole.user.role]} sang <span className="font-medium text-foreground">{ROLE_LABEL[pendingRole.role]}</span>. {ROLE_HINT[pendingRole.role]} Hồ sơ của vai trò cũ sẽ bị gỡ.
            {pendingRole.role === 'student' && (
              <span className="mt-3 block">
                <Select value={pendingClassId} onValueChange={setPendingClassId}>
                  <SelectTrigger aria-label="Lớp của sinh viên"><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
                  <SelectContent>
                    {(classes || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.classCode} · {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </span>
            )}
          </>
        )}
        confirmText="Đổi vai trò"
        onConfirm={changeRole}
      />
      <ConfirmDialog
        open={!!toReset}
        onOpenChange={(o) => !o && setToReset(null)}
        title="Đặt lại mật khẩu?"
        description={toReset && `Mật khẩu của @${toReset.username} sẽ về mặc định (bằng tên đăng nhập). Người dùng sẽ được nhắc đổi khi đăng nhập.`}
        confirmText="Đặt lại"
        onConfirm={resetPassword}
      />
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Không thể tự đổi vai trò hoặc tự khoá chính mình; hệ thống luôn giữ ít nhất 1 quản trị viên.</p>
    </>
  );
}
