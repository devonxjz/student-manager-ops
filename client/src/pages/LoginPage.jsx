import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Award, BookUser, Eye, EyeOff, GraduationCap, Loader2, LogIn, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { USE_MOCK } from '@/lib/api';
import { HOME_BY_ROLE, ROLE_LABEL } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormField from '@/components/FormField';
import Logo from '@/components/Logo';
import RoleBadge from '@/components/RoleBadge';

const schema = z.object({
  username: z.string().trim().min(1, 'Nhập tên đăng nhập'),
  password: z.string().min(1, 'Nhập mật khẩu'),
});

const DEMO = [
  { role: 'admin', username: 'admin', password: 'admin123', icon: ShieldCheck, tint: 'text-indigo-600 bg-indigo-50' },
  { role: 'teacher', username: 'gv001', password: 'gv001', icon: BookUser, tint: 'text-violet-600 bg-violet-50' },
  { role: 'student', username: '20520101', password: '20520101', icon: GraduationCap, tint: 'text-sky-600 bg-sky-50' },
];

const ease = [0.16, 1, 0.3, 1];

/** Màn chuyển tiếp sau khi đăng nhập: logo phóng to, lời chào, thanh tải, rồi vào dashboard. */
function WelcomeOverlay({ user }) {
  const name = user.profile?.fullName || user.username;
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      data-testid="welcome-overlay"
    >
      <motion.div
        className="absolute h-[140vmax] w-[140vmax] rounded-full bg-gradient-to-br from-indigo-50 via-white to-violet-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.9, ease }}
      />
      <div className="relative flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.4, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/30">
            <GraduationCap className="h-8 w-8" />
          </div>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, ease }} className="mt-6 text-sm text-muted-foreground">Xin chào,</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5, ease }} className="mt-1 text-2xl font-semibold tracking-tight">{name}</motion.h2>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-3">
          <RoleBadge role={user.role} />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-xs text-muted-foreground">
          Đang mở dashboard {ROLE_LABEL[user.role].toLowerCase()}…
        </motion.p>
        <div className="mt-3 h-1 w-48 overflow-hidden rounded-full bg-indigo-100">
          <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 0.3, duration: 1, ease: 'easeInOut' }} />
        </div>
      </div>
    </motion.div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="bg-grid absolute inset-0 opacity-10" />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />

      <Logo light className="relative" />

      <div className="relative mx-auto w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }} className="rounded-2xl bg-white/95 p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Tiến độ tín chỉ</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Đúng tiến độ</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">128 <span className="text-base font-normal text-slate-400">/ 150 tín chỉ</span></p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
            <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ delay: 0.7, duration: 1.4, ease }} className="h-full rounded-full bg-emerald-500" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[['Đã đạt', '128'], ['Còn thiếu', '22'], ['Số môn', '38']].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-slate-50 py-2">
                <p className="text-sm font-semibold text-slate-900">{v}</p>
                <p className="text-[11px] text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.7, ease }} className="absolute -right-8 -top-10">
          <div className="flex animate-float items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-xl">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-slate-700">+12 tín chỉ học kỳ này</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.7, ease }} className="absolute -bottom-8 -left-10">
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-xl" style={{ animation: 'float 7s ease-in-out 1s infinite' }}>
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-slate-700">IT003 · 8.5 · Đạt</span>
          </div>
        </motion.div>
      </div>

      <div className="relative">
        <p className="text-lg font-medium leading-relaxed text-white">“Mỗi vai trò một dashboard — sinh viên thấy tín chỉ, giáo viên quản lý lớp, quản trị nắm toàn cảnh.”</p>
        <p className="mt-3 text-sm text-indigo-200">Student Manager · Node.js trên AWS Elastic Beanstalk</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');
  const [welcome, setWelcome] = useState(null);
  const loggingIn = useRef(false); // tránh Navigate sớm trước khi màn chào mừng hiện

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (!welcome) return undefined;
    const target = location.state?.from && location.state.from !== '/login' ? location.state.from : HOME_BY_ROLE[welcome.role];
    const t = setTimeout(() => navigate(target, { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [welcome, navigate, location.state]);

  if (!loading && user && !welcome && !loggingIn.current) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  const onSubmit = async ({ username, password }) => {
    setServerError('');
    loggingIn.current = true;
    try {
      const me = await login(username, password);
      setWelcome(me);
    } catch (e) {
      loggingIn.current = false;
      setServerError(e.message);
    }
  };

  const fillDemo = (d) => {
    setValue('username', d.username, { shouldValidate: true });
    setValue('password', d.password, { shouldValidate: true });
    handleSubmit(onSubmit)();
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <AnimatePresence>{welcome && <WelcomeOverlay user={welcome} />}</AnimatePresence>

      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <Button asChild variant="ghost" size="sm" className="ml-auto text-muted-foreground">
            <Link to="/"><ArrowLeft /> Trang chủ</Link>
          </Button>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sinh viên dùng MSSV, giáo viên dùng mã GV.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
              <FormField id="username" label="Tên đăng nhập" error={errors.username}>
                <Input id="username" autoComplete="username" autoFocus placeholder="VD: 20520101" aria-invalid={!!errors.username} {...register('username')} />
              </FormField>
              <FormField id="password" label="Mật khẩu" error={errors.password}>
                <div className="relative">
                  <Input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" className="pr-10" aria-invalid={!!errors.password} {...register('password')} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <AnimatePresence>
                {serverError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto', x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0, height: 0 }}
                    role="alert"
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  >
                    {serverError}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
                {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </Button>
            </form>

            {USE_MOCK && (
              <div className="mt-8">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> Tài khoản demo <span className="h-px flex-1 bg-border" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {DEMO.map((d) => (
                    <button
                      key={d.role}
                      type="button"
                      onClick={() => fillDemo(d)}
                      disabled={isSubmitting}
                      data-testid={`demo-${d.role}`}
                      className="group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition hover:border-indigo-200 hover:bg-indigo-50/40 disabled:opacity-50"
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${d.tint} transition-transform group-hover:scale-110`}><d.icon className="h-4 w-4" /></span>
                      <span className="text-xs font-medium">{ROLE_LABEL[d.role]}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{d.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
        <p className="text-center text-xs text-muted-foreground">Quên mật khẩu? Liên hệ quản trị viên để được đặt lại.</p>
      </div>

      <BrandPanel />
    </div>
  );
}
