import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Activity, ArrowRight, Award, BarChart3, BookOpenCheck, ChevronDown, CloudCog, KeyRound, Lock,
  Menu, Rocket, ShieldCheck, Sparkles, Terminal, Users, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { HOME_BY_ROLE } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import AnimatedNumber from '@/components/AnimatedNumber';
import HeroMockup from '@/components/landing/HeroMockup';
import RolePreview from '@/components/landing/RolePreview';
import ArchitectureFlow from '@/components/landing/ArchitectureFlow';

const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease },
};

const NAV_LINKS = [
  ['#features', 'Tính năng'],
  ['#roles', 'Phân quyền'],
  ['#architecture', 'Kiến trúc'],
  ['#faq', 'Hỏi đáp'],
];

const TECH = ['React 18', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'Recharts', 'Node.js 20', 'Express', 'Sequelize', 'MySQL 8', 'Elastic Beanstalk', 'RDS', 'CloudWatch', 'GitHub Actions'];

const FEATURES = [
  { icon: ShieldCheck, title: 'Phân quyền 3 vai trò', desc: 'Sinh viên, giáo viên, quản trị — mỗi vai trò một menu, một dashboard. Giáo viên chỉ thao tác lớp mình chủ nhiệm.', tint: 'bg-indigo-50 text-indigo-600', span: 'md:col-span-2' },
  { icon: Award, title: 'Tín chỉ x / 150', desc: 'Tự tính từ các môn có điểm ≥ 5, hiển thị vòng tiến độ đổi màu theo ngưỡng.', tint: 'bg-emerald-50 text-emerald-600' },
  { icon: BookOpenCheck, title: 'Nhập điểm tức thì', desc: 'Bảng môn học + ô điểm, badge Đạt / Chưa đạt cập nhật ngay khi gõ.', tint: 'bg-amber-50 text-amber-600' },
  { icon: BarChart3, title: 'Dashboard biểu đồ', desc: 'Phân bố tín chỉ, tỉ lệ đạt theo môn, sĩ số từng lớp, tỉ lệ tài khoản — có cả chế độ xem bảng.', tint: 'bg-sky-50 text-sky-600', span: 'md:col-span-2' },
  { icon: Lock, title: 'JWT trong cookie httpOnly', desc: 'App stateless, scale nhiều instance trên EB vẫn đúng. Mật khẩu băm bcrypt.', tint: 'bg-rose-50 text-rose-600' },
  { icon: Activity, title: 'Log tập trung', desc: 'Winston ghi JSON ra stdout, EB đẩy lên CloudWatch kèm requestId và user.', tint: 'bg-violet-50 text-violet-600' },
  { icon: CloudCog, title: 'Hạ tầng dạng code', desc: '.ebextensions, .platform, Procfile — cấu hình môi trường nằm trong repo.', tint: 'bg-teal-50 text-teal-600' },
];

const STEPS = [
  { icon: Terminal, title: 'Build React', code: 'npm run build', desc: 'Vite sinh client/dist, Express phục vụ trên cùng domain.' },
  { icon: Rocket, title: 'Deploy lên EB', code: 'eb deploy', desc: 'Migrate + seed tự chạy qua container_commands (leader_only).' },
  { icon: Activity, title: 'Theo dõi', code: 'eb logs', desc: 'Health Green, log trên CloudWatch, rollback bằng Application versions.' },
];

const FAQ = [
  ['Tín chỉ được tính thế nào?', 'Cộng số tín chỉ của các môn có điểm ≥ 5.0 (thang 10). Mỗi môn chỉ tính một lần. Tổng yêu cầu là 150 tín chỉ.'],
  ['Giáo viên có xem được lớp khác không?', 'Không. Middleware checkClassOwnership so khớp lớp với giáo viên chủ nhiệm, sai sẽ trả 403. Chỉ quản trị viên xem được mọi lớp.'],
  ['Tài khoản sinh viên được tạo ra sao?', 'Khi giáo viên hoặc quản trị thêm sinh viên, hệ thống tự tạo tài khoản với tên đăng nhập và mật khẩu ban đầu là MSSV. Lần đầu đăng nhập sẽ được nhắc đổi mật khẩu.'],
  ['Vì sao RDS tạo tách khỏi Elastic Beanstalk?', 'Nếu tạo database bên trong môi trường EB, khi terminate môi trường thì database bị xoá theo. Tạo riêng giúp dữ liệu an toàn.'],
];

function Nav() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const cta = user
    ? <Button asChild size="sm"><Link to={HOME_BY_ROLE[user.role]}>Vào dashboard <ArrowRight /></Link></Button>
    : <Button asChild size="sm"><Link to="/login">Đăng nhập <ArrowRight /></Link></Button>;
  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-300', scrolled ? 'border-b bg-white/80 backdrop-blur-lg' : 'bg-transparent')}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/"><Logo /></Link>
        <nav aria-label="Điều hướng trang" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">{label}</a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {!user && <Button asChild variant="ghost" size="sm"><a href="#roles">Xem demo</a></Button>}
          {cta}
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <motion.nav aria-label="Menu di động" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="border-b bg-white px-6 pb-4 md:hidden">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-slate-700">{label}</a>
          ))}
          <div className="mt-2">{cta}</div>
        </motion.nav>
      )}
    </header>
  );
}

function Hero() {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -60]);
  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pt-36">
      {/* nền */}
      <div className="bg-grid mask-fade-b absolute inset-0 -z-10 opacity-70" />
      <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/60 via-violet-200/40 to-sky-200/40 blur-3xl" />

      <div className="container text-center">
        <motion.a
          href="#architecture"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="group inline-flex items-center gap-2 rounded-full border bg-white/70 py-1 pl-1 pr-3 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:border-indigo-200"
        >
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-white">Mới</span>
          Triển khai trên AWS Elastic Beanstalk + RDS
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </motion.a>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease }}
          className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl"
        >
          Quản lý sinh viên & tiến độ tín chỉ <span className="text-gradient">trong một dashboard</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-slate-600"
        >
          Sinh viên xem tín chỉ đã đạt, giáo viên quản lý lớp chủ nhiệm và nhập điểm, quản trị viên nắm toàn cảnh bằng biểu đồ và cấp quyền tập trung.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg" className="group w-full sm:w-auto">
            <Link to={user ? HOME_BY_ROLE[user.role] : '/login'}>
              {user ? 'Vào dashboard' : 'Đăng nhập hệ thống'} <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <a href="#features"><Sparkles className="text-indigo-500" /> Khám phá tính năng</a>
          </Button>
        </motion.div>
      </div>

      <motion.div style={{ y }} className="container mt-16">
        <HeroMockup />
      </motion.div>
    </section>
  );
}

function TechMarquee() {
  return (
    <section className="border-y bg-white py-8">
      <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">Xây dựng trên nền tảng</p>
      <div className="mask-fade-x relative overflow-hidden">
        <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {[...TECH, ...TECH].map((t, i) => (
            <span key={i} className="whitespace-nowrap rounded-full border bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600">{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { value: 3, label: 'vai trò phân quyền', suffix: '' },
    { value: 150, label: 'tín chỉ để tốt nghiệp', suffix: '' },
    { value: 30, label: 'REST API endpoint', suffix: '+' },
    { value: 1, label: 'lệnh để deploy', suffix: '' },
  ];
  return (
    <section className="py-16">
      <div className="container grid grid-cols-2 gap-6 md:grid-cols-4">
        {items.map((s, i) => (
          <motion.div key={s.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className="text-center">
            <p className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              <AnimatedNumber value={s.value} duration={1.6} />{s.suffix}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, desc }) {
  return (
    <motion.div {...fadeUp} className="mx-auto mb-12 max-w-2xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-pretty text-slate-600">{desc}</p>}
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20">
      <div className="container">
        <SectionHeading eyebrow="Tính năng" title="Mọi thứ cần thiết để quản lý đào tạo" desc="Thiết kế theo phong cách SaaS: gọn, trắng, màu sắc chỉ dùng cho những gì cần chú ý." />
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -4 }}
              className={cn('group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-900/5', f.span)}
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-100/0 to-indigo-100/0 transition-all duration-500 group-hover:from-indigo-100/60 group-hover:to-violet-100/40" />
              <div className={cn('relative flex h-11 w-11 items-center justify-center rounded-xl', f.tint)}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-5 font-semibold text-slate-900">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </motion.div>
          ))}
          <motion.div {...fadeUp} className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-500/20 sm:flex-row sm:items-center sm:justify-between md:col-span-3">
            <div className="bg-grid absolute inset-0 opacity-10" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-lg font-semibold">Sẵn sàng cho cả khoa</p>
                <p className="mt-0.5 text-sm text-indigo-100">Thêm sinh viên tự tạo tài khoản, lần đầu đăng nhập được nhắc đổi mật khẩu.</p>
              </div>
            </div>
            <Button asChild variant="secondary" className="relative shrink-0 bg-white text-indigo-700 hover:bg-indigo-50">
              <Link to="/login">Dùng thử ngay <ArrowRight /></Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" className="scroll-mt-20 bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="container">
        <SectionHeading eyebrow="Phân quyền" title="Mỗi vai trò một trải nghiệm riêng" desc="Đăng nhập xong, hệ thống tự đưa bạn tới dashboard phù hợp với quyền của mình." />
        <motion.div {...fadeUp}><RolePreview /></motion.div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section id="architecture" className="scroll-mt-20 py-20">
      <div className="container">
        <SectionHeading eyebrow="Kiến trúc" title="Một app Node, một môi trường, một domain" desc="React build tĩnh được chính Express phục vụ. Không cần S3/CloudFront riêng, không lo CORS, cookie đăng nhập dùng chung." />
        <motion.div {...fadeUp}><ArchitectureFlow /></motion.div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="relative rounded-2xl border bg-white p-6">
              <span className="absolute right-5 top-5 text-5xl font-bold text-slate-100">{i + 1}</span>
              <s.icon className="relative h-5 w-5 text-primary" />
              <h3 className="relative mt-4 font-semibold">{s.title}</h3>
              <code className="relative mt-3 inline-block rounded-md bg-slate-900 px-2.5 py-1 font-mono text-xs text-emerald-300">$ {s.code}</code>
              <p className="relative mt-3 text-sm text-slate-600">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-20 bg-slate-50/70 py-20">
      <div className="container max-w-3xl">
        <SectionHeading eyebrow="Hỏi đáp" title="Câu hỏi thường gặp" />
        <div className="space-y-3">
          {FAQ.map(([q, a], i) => (
            <motion.div key={q} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="overflow-hidden rounded-xl border bg-white">
              <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-slate-900" aria-expanded={open === i}>
                {q}
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300', open === i && 'rotate-180')} />
              </button>
              <motion.div initial={false} animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  const { user } = useAuth();
  return (
    <section className="py-20">
      <div className="container">
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-center sm:px-16">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="bg-grid absolute inset-0 opacity-[0.07]" />
          <KeyRound className="relative mx-auto h-8 w-8 text-indigo-300" />
          <h2 className="relative mx-auto mt-5 max-w-xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">Đăng nhập để vào dashboard của bạn</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-slate-300">Sinh viên dùng MSSV, giáo viên dùng mã GV. Hệ thống tự nhận diện vai trò và mở đúng trang quản lý.</p>
          <div className="relative mt-8 flex justify-center">
            <Button asChild size="lg" className="bg-white text-slate-900 shadow-none hover:bg-slate-100">
              <Link to={user ? HOME_BY_ROLE[user.role] : '/login'}>{user ? 'Vào dashboard' : 'Bắt đầu ngay'} <ArrowRight /></Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <Logo />
        <p>Đồ án nhóm DevOps & IaC · Node.js trên AWS Elastic Beanstalk · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main>
        <Hero />
        <TechMarquee />
        <Stats />
        <Features />
        <Roles />
        <Architecture />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
