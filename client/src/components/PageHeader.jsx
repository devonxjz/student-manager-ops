import { motion } from 'framer-motion';

export default function PageHeader({ title, description, actions, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        {children}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
