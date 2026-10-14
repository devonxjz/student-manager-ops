import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';

const normalize = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

/**
 * Bảng dữ liệu có tìm kiếm, sắp xếp, phân trang phía client.
 * columns: [{ key, header, cell?(row), sortable?, sortValue?(row), className?, headClassName? }]
 */
export default function DataTable({
  columns, data, loading, searchKeys = [], searchPlaceholder = 'Tìm kiếm…',
  toolbar, filter, pageSize = 10, emptyTitle, emptyDescription, rowKey = 'id', onRowClick, testId,
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(null); // { key, dir }
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    let r = data || [];
    if (filter) r = r.filter(filter);
    if (query.trim()) {
      const q = normalize(query.trim());
      r = r.filter((row) => searchKeys.some((k) => normalize(typeof k === 'function' ? k(row) : row[k]).includes(q)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const val = col?.sortValue || ((row) => row[sort.key]);
      r = [...r].sort((a, b) => {
        const x = val(a); const y = val(b);
        const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'vi');
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return r;
  }, [data, filter, query, searchKeys, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = rows.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key) => {
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));
  };

  return (
    <Card className="overflow-hidden" data-testid={testId}>
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        {searchKeys.length > 0 ? (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              className="pl-9"
              aria-label="Tìm kiếm"
            />
          </div>
        ) : <div />}
        {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.key} className={c.headClassName}>
                {c.sortable ? (
                  <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground">
                    {c.header}
                    {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                ) : c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && !data ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((c) => <TableCell key={c.key}><Skeleton className="h-4 w-full max-w-[160px]" /></TableCell>)}
              </TableRow>
            ))
          ) : visible.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <EmptyState title={query ? 'Không tìm thấy kết quả' : emptyTitle} description={query ? `Không có dòng nào khớp “${query}”.` : emptyDescription} />
              </TableCell>
            </TableRow>
          ) : (
            visible.map((row) => (
              <TableRow key={row[rowKey]} className={cn(onRowClick && 'cursor-pointer')} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((c) => <TableCell key={c.key} className={c.className}>{c.cell ? c.cell(row) : row[c.key]}</TableCell>)}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
        <span className="tabular">
          {rows.length === 0 ? '0 dòng' : `${current * pageSize + 1}–${Math.min(rows.length, (current + 1) * pageSize)} / ${rows.length} dòng`}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Trang trước">
            <ChevronLeft />
          </Button>
          <span className="tabular px-2 text-xs">Trang {current + 1}/{pageCount}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} aria-label="Trang sau">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </Card>
  );
}
