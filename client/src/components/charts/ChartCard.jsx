import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Table2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Khung biểu đồ: tiêu đề, mô tả, nút chuyển sang chế độ bảng (cho người khó phân biệt màu / cần số liệu chính xác).
 * table: { columns: [{ key, header, align? }], rows: [] }
 */
export default function ChartCard({ title, description, actions, table, children, className, index = 0, contentClassName }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 * index + 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {table && (
              <button
                type="button"
                onClick={() => setAsTable((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={asTable ? 'Xem biểu đồ' : 'Xem dạng bảng'}
                title={asTable ? 'Xem biểu đồ' : 'Xem dạng bảng'}
              >
                {asTable ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className={cn('flex-1', contentClassName)}>
          {asTable && table ? (
            <div className="max-h-[280px] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    {table.columns.map((c) => (
                      <th key={c.key} className={cn('px-3 py-2 text-left text-xs font-medium text-muted-foreground', c.align === 'right' && 'text-right')}>{c.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      {table.columns.map((c) => (
                        <td key={c.key} className={cn('px-3 py-2', c.align === 'right' && 'tabular text-right')}>{r[c.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
