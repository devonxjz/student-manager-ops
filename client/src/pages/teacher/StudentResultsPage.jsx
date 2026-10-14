import { useEffect, useMemo, useState } from 'react';
import { Link, useBlocker, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, RotateCcw, Save, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { creditTone, PASS_SCORE } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/PageHeader';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ErrorState from '@/components/ErrorState';

const parse = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const invalid = (v) => v !== '' && v !== null && (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > 10);

function ResultBadge({ value }) {
  if (invalid(value)) return <Badge variant="destructive">Không hợp lệ</Badge>;
  const n = parse(value);
  if (n === null) return <Badge variant="secondary">Chưa có điểm</Badge>;
  return n >= PASS_SCORE ? <Badge variant="success">Đạt</Badge> : <Badge variant="destructive">Chưa đạt</Badge>;
}

export default function StudentResultsPage() {
  const { classId, id } = useParams();
  const path = `/teacher/classes/${classId}/students/${id}/results`;
  const { data, error, loading, reload, setData } = useApi(path);
  const [scores, setScores] = useState({}); // courseId -> string
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);

  const original = useMemo(() => Object.fromEntries((data?.courses || []).map((c) => [c.courseId, c.score === null ? '' : String(c.score)])), [data]);
  useEffect(() => { setScores(original); }, [original]);

  // giá trị đang hiển thị: điểm đang sửa, nếu chưa sửa thì điểm đã lưu
  const valueOf = (cid) => scores[cid] ?? original[cid] ?? '';
  const dirtyIds = Object.keys(scores).filter((k) => scores[k] !== original[k]);
  const hasInvalid = Object.values(scores).some(invalid);

  // Cảnh báo khi rời trang mà chưa lưu
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirtyIds.length > 0 && currentLocation.pathname !== nextLocation.pathname);

  const live = useMemo(() => {
    if (!data) return { earned: 0, passed: 0, percent: 0 };
    let earned = 0; let passed = 0;
    data.courses.forEach((c) => {
      const v = scores[c.courseId] ?? original[c.courseId];
      const n = parse(v);
      if (!invalid(v) && n !== null && n >= PASS_SCORE) { earned += c.credits; passed += 1; }
    });
    return { earned, passed, percent: Math.min(100, Math.round((earned / data.total) * 100)) };
  }, [data, scores, original]);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (data?.courses || []).filter((c) => {
      // lọc theo điểm đã lưu, để dòng không biến mất khi đang gõ
      const has = original[c.courseId] !== '' && original[c.courseId] !== undefined;
      if (tab === 'graded' && !has) return false;
      if (tab === 'ungraded' && has) return false;
      return !k || c.courseCode.toLowerCase().includes(k) || c.name.toLowerCase().includes(k);
    });
  }, [data, original, tab, q]);

  const save = async () => {
    setSaving(true);
    try {
      const results = dirtyIds.map((cid) => ({ courseId: Number(cid), score: parse(scores[cid]) }));
      const updated = await api(path, { method: 'PUT', body: { results } });
      setData(updated);
      toast.success(`Đã lưu ${results.length} điểm`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !data) return <div className="space-y-6"><Skeleton className="h-10 w-80" /><Skeleton className="h-28" /><Skeleton className="h-96" /></div>;

  const tone = creditTone(live.percent);
  const st = data.student;

  return (
    <>
      <PageHeader title={`Nhập điểm · ${st.fullName}`} description={`MSSV ${st.studentCode} · Lớp ${st.class?.classCode}`}>
        <Link to={`/teacher/classes/${classId}`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Về lớp {st.class?.classCode}
        </Link>
      </PageHeader>

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-muted-foreground">Tín chỉ tích luỹ (xem trước)</p>
              <p className="text-sm"><span className={cn('text-2xl font-bold', tone.text)} data-testid="live-credits">{live.earned}</span><span className="text-muted-foreground"> / {data.total}</span></p>
            </div>
            <Progress value={live.percent} className={cn('mt-2', tone.track)} indicatorClassName={tone.bar} />
            <p className="mt-2 text-xs text-muted-foreground">{live.passed} môn đạt · {live.percent}% · {tone.label}</p>
          </div>
          <div className="flex gap-2 sm:border-l sm:pl-5">
            <Button variant="outline" onClick={() => setScores(original)} disabled={!dirtyIds.length || saving}><RotateCcw /> Huỷ thay đổi</Button>
            <Button onClick={save} disabled={!dirtyIds.length || hasInvalid || saving} data-testid="save-results">
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Lưu {dirtyIds.length ? `(${dirtyIds.length})` : ''}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="graded">Đã có điểm</TabsTrigger>
              <TabsTrigger value="ungraded">Chưa có điểm</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm môn học…" className="pl-9" aria-label="Tìm môn học" />
          </div>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead>Mã môn</TableHead><TableHead>Tên môn</TableHead><TableHead className="text-right">Số TC</TableHead>
                <TableHead className="w-32">Điểm (0–10)</TableHead><TableHead>Kết quả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const dirty = valueOf(c.courseId) !== original[c.courseId];
                const v = valueOf(c.courseId);
                return (
                  <TableRow key={c.courseId} className={cn(dirty && 'bg-indigo-50/50 hover:bg-indigo-50/70')}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.courseCode}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="tabular text-right">{c.credits}</TableCell>
                    <TableCell>
                      <Input
                        type="number" step="0.1" min="0" max="10" inputMode="decimal"
                        value={v}
                        onChange={(e) => setScores((s) => ({ ...s, [c.courseId]: e.target.value }))}
                        className={cn('tabular h-8 w-24', dirty && 'border-indigo-300')}
                        aria-invalid={invalid(v)}
                        aria-label={`Điểm ${c.courseCode}`}
                        placeholder="—"
                      />
                    </TableCell>
                    <TableCell>
                      <AnimatePresence mode="wait">
                        <motion.span key={String(parse(v) >= PASS_SCORE) + String(v === '') + invalid(v)} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} className="inline-block">
                          <ResultBadge value={v} />
                        </motion.span>
                      </AnimatePresence>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={blocker.state === 'blocked'} onOpenChange={(o) => !o && blocker.reset?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rời trang khi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>Bạn có {dirtyIds.length} điểm chưa lưu. Nếu rời trang, các thay đổi này sẽ mất.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Ở lại</AlertDialogCancel>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>Rời trang</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
