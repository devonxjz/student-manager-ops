import Logo from '@/components/Logo';

export default function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Logo className="animate-pulse" />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-indigo-100">
          <div className="h-full w-1/2 rounded-full bg-primary" style={{ animation: 'loader 1.1s ease-in-out infinite' }} />
        </div>
      </div>
      <style>{'@keyframes loader{from{transform:translateX(-100%)}to{transform:translateX(200%)}}'}</style>
    </div>
  );
}
