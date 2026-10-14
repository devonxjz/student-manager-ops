// Fetch wrapper dùng chung. Khi VITE_USE_MOCK=true, request được chuyển sang API giả lập trong trình duyệt.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Phát khi API trả 401: AuthContext xoá user, ProtectedRoute tự đưa về /login (không reload trang)
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

async function send(path, { method, body }) {
  if (USE_MOCK) {
    const { mockFetch } = await import('@/mocks/server');
    return mockFetch(path, { method, body });
  }
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

export async function api(path, { method = 'GET', body, redirectOn401 = true } = {}) {
  const { status, data } = await send(path, { method, body });
  if (status === 401 && redirectOn401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  if (status < 200 || status >= 300) throw new ApiError(data?.error || 'Có lỗi xảy ra', status, data?.details);
  return data;
}
