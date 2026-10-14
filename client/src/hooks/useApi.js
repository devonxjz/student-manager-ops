import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

/** Tải dữ liệu GET, có reload() để gọi lại sau khi thêm/sửa/xoá. */
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const d = await api(path);
      if (alive.current) { setData(d); setError(null); }
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => { alive.current = false; };
  }, [reload]);

  return { data, error, loading, reload, setData };
}
