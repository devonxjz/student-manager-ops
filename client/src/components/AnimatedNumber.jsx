import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { formatNumber } from '@/lib/format';

/** Đếm số từ 0 lên giá trị đích khi xuất hiện trên màn hình. */
export default function AnimatedNumber({ value, duration = 1.1, format = formatNumber, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return undefined;
    const node = ref.current;
    const controls = animate(0, value ?? 0, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { node.textContent = format(Math.round(v)); },
    });
    return () => controls.stop();
  }, [inView, value, duration, format]);
  return <span ref={ref} className={className}>{format(0)}</span>;
}
