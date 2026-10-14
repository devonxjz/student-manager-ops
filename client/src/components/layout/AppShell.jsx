import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen, ChevronsUpDown, DatabaseZap, GraduationCap, KeyRound, LayoutDashboard, LogOut, Menu,
  School, ShieldCheck, TriangleAlert, UserRound, Users, Award, Presentation,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { USE_MOCK } from '@/lib/api';
import { initials, ROLE_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import RoleBadge from '@/components/RoleBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV = {
  student: [
    { section: 'Học tập', items: [
      { to: '/me/credits', label: 'Tín chỉ của tôi', icon: Award },
      { to: '/me/profile', label: 'Thông tin cá nhân', icon: UserRound },
    ] },
  ],
  teacher: [
    { section: 'Giảng dạy', items: [
      { to: '/teacher', label: 'Tổng quan', icon: LayoutDashboard, end: true },
      { to: '/teacher/classes', label: 'Lớp của tôi', icon: Presentation },
    ] },
  ],
  admin: [
    { section: 'Tổng quan', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
    { section: 'Quản lý', items: [
      { to: '/admin/classes', label: 'Lớp học', icon: School },
      { to: '/admin/teachers', label: 'Giáo viên', icon: Users },
      { to: '/admin/students', label: 'Sinh viên', icon: GraduationCap },
      { to: '/admin/courses', label: 'Môn học', icon: BookOpen },
    ] },
    { section: 'Giảng dạy', items: [{ to: '/teacher/classes', label: 'Nhập điểm theo lớp', icon: Presentation }] },
    { section: 'Hệ thống', items: [{ to: '/admin/users', label: 'Phân quyền', icon: ShieldCheck }] },
  ],
};

const COMMON = { section: 'Tài khoản', items: [{ to: '/password', label: 'Đổi mật khẩu', icon: KeyRound }] };

function SidebarNav({ role, onNavigate }) {
  const groups = [...(NAV[role] || []), COMMON];
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Điều hướng chính">
      {groups.map((g) => (
        <div key={g.section}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.section}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  end={it.end}
                  onClick={onNavigate}
                  className={({ isActive }) => cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-lg bg-indigo-50 ring-1 ring-inset ring-indigo-100"
                          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        />
                      )}
                      <it.icon className={cn('relative h-[18px] w-[18px]', isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600')} />
                      <span className="relative">{it.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserMenu({ user, onLogout, compact }) {
  const navigate = useNavigate();
  const name = user.profile?.fullName || user.username;
  const resetDemo = async () => {
    const { resetMockDb } = await import('@/mocks/server');
    resetMockDb();
    toast.success('Đã khôi phục dữ liệu demo');
    navigate(0);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid={compact ? 'user-menu-mobile' : 'user-menu'}
          className={cn('flex items-center gap-3 rounded-lg text-left transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring', compact ? 'p-1' : 'w-full p-2')}
        >
          <Avatar className="h-8 w-8"><AvatarFallback>{initials(name)}</AvatarFallback></Avatar>
          {!compact && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user.role]} · {user.username}</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-slate-400" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? 'end' : 'start'} side={compact ? 'bottom' : 'top'} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
          <RoleBadge role={user.role} className="mt-2" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === 'student' && (
          <DropdownMenuItem onSelect={() => navigate('/me/profile')}><UserRound /> Thông tin cá nhân</DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => navigate('/password')}><KeyRound /> Đổi mật khẩu</DropdownMenuItem>
        {USE_MOCK && <DropdownMenuItem onSelect={resetDemo}><DatabaseZap /> Khôi phục dữ liệu demo</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 [&_svg]:text-rose-500">
          <LogOut /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarBody({ user, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <Link to="/" onClick={onNavigate}><Logo /></Link>
      </div>
      <SidebarNav role={user.role} onNavigate={onNavigate} />
      {USE_MOCK && (
        <div className="mx-3 mb-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-semibold">Chế độ demo</span> · dữ liệu giả lập trong trình duyệt
        </div>
      )}
      <div className="border-t p-3">
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet(); // giữ nguyên trang cũ trong lúc chạy hiệu ứng thoát
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* Sidebar cố định (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:block">
        <SidebarBody user={user} onLogout={handleLogout} />
      </aside>

      {/* Sidebar dạng ngăn kéo (mobile) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody user={user} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
            <Menu />
          </Button>
          <div className="lg:hidden"><Logo compact /></div>
          <p className="hidden text-sm text-muted-foreground lg:block">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <RoleBadge role={user.role} className="hidden sm:inline-flex" />
            <div className="lg:hidden"><UserMenu user={user} onLogout={handleLogout} compact /></div>
          </div>
        </header>

        {user.mustChangePassword && location.pathname !== '/password' && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-500" />
              Bạn đang dùng mật khẩu mặc định.
              <Link to="/password" className="font-semibold underline underline-offset-2 hover:text-amber-900">Đổi mật khẩu ngay</Link>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
