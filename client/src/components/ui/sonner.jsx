import { Toaster as Sonner } from 'sonner';

function Toaster(props) {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{ classNames: { toast: 'rounded-xl border shadow-lg font-sans' } }}
      {...props}
    />
  );
}

export { Toaster };
