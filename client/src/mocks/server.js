// API giả lập chạy trong trình duyệt, bám theo hợp đồng API ở docs/SPEC.md mục 9.
// Chỉ dùng khi VITE_USE_MOCK=true (npm run dev:mock). Dữ liệu lưu ở localStorage.
import { buildSeed } from './seed';

export const TOTAL_REQUIRED_CREDITS = 150;
export const PASS_SCORE = 5;

const DB_KEY = 'sm-mock-db-v1';
const SESSION_KEY = 'sm-mock-session';

class MockError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let db = load();

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* bỏ qua, tạo lại */ }
  const fresh = buildSeed();
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}
const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
const nextId = (table) => (db.seq[table] = (db.seq[table] || 0) + 1);

export function resetMockDb() {
  db = buildSeed();
  save();
}

// ---------- helpers ----------
const now = () => new Date().toISOString();
const required = (body, fields) => {
  const missing = fields.filter((f) => body?.[f] === undefined || body?.[f] === null || String(body[f]).trim() === '');
  if (missing.length) throw new MockError(422, 'Dữ liệu không hợp lệ', missing.map((f) => ({ field: f, msg: 'Bắt buộc' })));
};
const unique = (table, field, value, exceptId) => {
  if (db[table].some((r) => String(r[field]).toLowerCase() === String(value).toLowerCase() && r.id !== exceptId)) {
    throw new MockError(409, `${field === 'username' ? 'Tên đăng nhập' : 'Mã'} "${value}" đã tồn tại`);
  }
};
const find = (table, id) => db[table].find((r) => r.id === Number(id));
const mustFind = (table, id, msg) => {
  const r = find(table, id);
  if (!r) throw new MockError(404, msg);
  return r;
};

function earnedCredits(studentId) {
  return db.studentCourses
    .filter((sc) => sc.studentId === studentId && sc.score !== null && sc.score >= PASS_SCORE)
    .reduce((s, sc) => s + (find('courses', sc.courseId)?.credits || 0), 0);
}

const teacherView = (t) => t && ({ id: t.id, teacherCode: t.teacherCode, fullName: t.fullName });

function studentView(st) {
  const cls = find('classes', st.classId);
  const user = find('users', st.userId);
  return {
    id: st.id, userId: st.userId, studentCode: st.studentCode, fullName: st.fullName,
    dateOfBirth: st.dateOfBirth, email: st.email, classId: st.classId,
    class: cls ? { id: cls.id, classCode: cls.classCode, name: cls.name } : null,
    earnedCredits: earnedCredits(st.id), isActive: user?.isActive ?? true,
  };
}

function classView(c) {
  const students = db.students.filter((s) => s.classId === c.id);
  const credits = students.map((s) => earnedCredits(s.id));
  return {
    id: c.id, classCode: c.classCode, name: c.name, intakeYear: c.intakeYear ?? null, teacherId: c.teacherId,
    teacher: teacherView(find('teachers', c.teacherId)),
    studentCount: students.length,
    avgCredits: credits.length ? Math.round(credits.reduce((a, b) => a + b, 0) / credits.length) : 0,
    atRisk: credits.filter((v) => (v / TOTAL_REQUIRED_CREDITS) * 100 < 40).length,
  };
}

function profileOf(user) {
  if (user.role === 'teacher') {
    const t = db.teachers.find((x) => x.userId === user.id);
    return t && { fullName: t.fullName, email: t.email, teacherCode: t.teacherCode, teacherId: t.id };
  }
  if (user.role === 'student') {
    const st = db.students.find((x) => x.userId === user.id);
    if (!st) return null;
    const cls = find('classes', st.classId);
    const t = cls && find('teachers', cls.teacherId);
    return {
      fullName: st.fullName, email: st.email, studentCode: st.studentCode, dateOfBirth: st.dateOfBirth, studentId: st.id,
      class: cls ? { id: cls.id, classCode: cls.classCode, name: cls.name } : null,
      homeroomTeacher: t ? { fullName: t.fullName, email: t.email } : null,
    };
  }
  return { fullName: user.fullName || 'Quản trị viên' };
}

const meView = (u) => ({ id: u.id, username: u.username, role: u.role, isActive: u.isActive, mustChangePassword: !!u.mustChangePassword, profile: profileOf(u) });

const BUCKETS = [
  { label: '0–29', min: 0, max: 29 }, { label: '30–59', min: 30, max: 59 }, { label: '60–89', min: 60, max: 89 },
  { label: '90–119', min: 90, max: 119 }, { label: '120–149', min: 120, max: 149 }, { label: '150+', min: 150, max: Infinity },
];
const distribution = (credits) => BUCKETS.map((b) => ({ range: b.label, count: credits.filter((c) => c >= b.min && c <= b.max).length }));
const bands = (credits) => {
  const pct = credits.map((c) => (c / TOTAL_REQUIRED_CREDITS) * 100);
  return { good: pct.filter((p) => p >= 75).length, warning: pct.filter((p) => p >= 40 && p < 75).length, danger: pct.filter((p) => p < 40).length };
};

// ---------- auth ----------
function currentUser() {
  const id = Number(localStorage.getItem(SESSION_KEY));
  const u = id && find('users', id);
  if (!u) throw new MockError(401, 'Chưa đăng nhập');
  if (!u.isActive) { localStorage.removeItem(SESSION_KEY); throw new MockError(401, 'Tài khoản đã bị khoá'); }
  return u;
}
const authorize = (u, ...roles) => { if (!roles.includes(u.role)) throw new MockError(403, 'Bạn không có quyền truy cập'); };
function classOwnership(u, classId) {
  const cls = mustFind('classes', classId, 'Không tìm thấy lớp');
  if (u.role === 'admin') return cls;
  const t = db.teachers.find((x) => x.userId === u.id);
  if (!t || cls.teacherId !== t.id) throw new MockError(403, 'Lớp này không do bạn quản lý');
  return cls;
}

// ---------- nghiệp vụ dùng chung ----------
function createStudent(data) {
  required(data, ['studentCode', 'fullName', 'classId']);
  unique('students', 'studentCode', data.studentCode);
  unique('users', 'username', data.studentCode);
  mustFind('classes', data.classId, 'Không tìm thấy lớp');
  const user = { id: nextId('users'), username: data.studentCode, password: data.studentCode, role: 'student', isActive: true, mustChangePassword: true, createdAt: now() };
  db.users.push(user);
  const st = { id: nextId('students'), userId: user.id, studentCode: data.studentCode, fullName: data.fullName, dateOfBirth: data.dateOfBirth || null, email: data.email || '', classId: Number(data.classId) };
  db.students.push(st);
  save();
  return studentView(st);
}
function updateStudent(st, data) {
  required(data, ['studentCode', 'fullName']);
  unique('students', 'studentCode', data.studentCode, st.id);
  if (data.classId !== undefined) mustFind('classes', data.classId, 'Không tìm thấy lớp');
  Object.assign(st, {
    studentCode: data.studentCode, fullName: data.fullName, dateOfBirth: data.dateOfBirth || null, email: data.email || '',
    classId: data.classId !== undefined ? Number(data.classId) : st.classId,
  });
  const user = find('users', st.userId);
  if (user) user.username = st.studentCode;
  save();
  return studentView(st);
}
function removeStudent(st) {
  db.studentCourses = db.studentCourses.filter((sc) => sc.studentId !== st.id);
  db.students = db.students.filter((s) => s.id !== st.id);
  db.users = db.users.filter((u) => u.id !== st.userId);
  save();
}
function resultsOf(st) {
  return {
    student: studentView(st),
    total: TOTAL_REQUIRED_CREDITS, passScore: PASS_SCORE,
    courses: db.courses.map((c) => {
      const sc = db.studentCourses.find((r) => r.studentId === st.id && r.courseId === c.id);
      return { courseId: c.id, courseCode: c.courseCode, name: c.name, credits: c.credits, score: sc ? sc.score : null };
    }),
  };
}

// ---------- router ----------
const routes = [];
// needsAuth = true: router tự gọi currentUser() và truyền vào handler (giống middleware authenticate)
const on = (method, pattern, handler, needsAuth = false) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
  routes.push({ method, re, keys, handler, needsAuth });
};

on('POST', '/auth/login', (_, body) => {
  required(body, ['username', 'password']);
  const u = db.users.find((x) => x.username.toLowerCase() === String(body.username).trim().toLowerCase());
  if (!u || u.password !== body.password) throw new MockError(401, 'Sai tên đăng nhập hoặc mật khẩu');
  if (!u.isActive) throw new MockError(403, 'Tài khoản đã bị khoá, liên hệ quản trị viên');
  localStorage.setItem(SESSION_KEY, String(u.id));
  return meView(u);
});
on('POST', '/auth/logout', () => { localStorage.removeItem(SESSION_KEY); return null; });
on('GET', '/auth/me', () => meView(currentUser()));
on('PUT', '/auth/password', (_, body) => {
  const u = currentUser();
  required(body, ['currentPassword', 'newPassword']);
  if (u.password !== body.currentPassword) throw new MockError(400, 'Mật khẩu hiện tại không đúng');
  if (String(body.newPassword).length < 6) throw new MockError(422, 'Mật khẩu mới tối thiểu 6 ký tự');
  u.password = body.newPassword;
  u.mustChangePassword = false;
  save();
  return { message: 'Đã đổi mật khẩu' };
});

// Sinh viên: luôn lấy studentId từ phiên đăng nhập, không nhận từ URL
on('GET', '/me/credits', () => {
  const u = currentUser();
  authorize(u, 'student');
  const st = db.students.find((x) => x.userId === u.id);
  if (!st) throw new MockError(404, 'Không tìm thấy hồ sơ sinh viên');
  const rows = db.studentCourses.filter((sc) => sc.studentId === st.id).map((sc) => {
    const c = find('courses', sc.courseId);
    return { code: c.courseCode, name: c.name, credits: c.credits, score: sc.score };
  });
  const passed = rows.filter((r) => r.score >= PASS_SCORE);
  const earned = passed.reduce((s, r) => s + r.credits, 0);
  return {
    earned, total: TOTAL_REQUIRED_CREDITS,
    percent: Math.min(100, Math.round((earned / TOTAL_REQUIRED_CREDITS) * 100)),
    courses: passed,
    failedCourses: rows.filter((r) => r.score < PASS_SCORE),
  };
});

// Giáo viên (admin dùng chung)
on('GET', '/teacher/classes', () => {
  const u = currentUser();
  authorize(u, 'teacher', 'admin');
  if (u.role === 'admin') return db.classes.map(classView);
  const t = db.teachers.find((x) => x.userId === u.id);
  return db.classes.filter((c) => c.teacherId === t?.id).map(classView);
});
on('GET', '/teacher/stats', () => {
  const u = currentUser();
  authorize(u, 'teacher', 'admin');
  const t = db.teachers.find((x) => x.userId === u.id);
  const classes = u.role === 'admin' ? db.classes : db.classes.filter((c) => c.teacherId === t?.id);
  const ids = new Set(classes.map((c) => c.id));
  const credits = db.students.filter((s) => ids.has(s.classId)).map((s) => earnedCredits(s.id));
  return {
    classCount: classes.length,
    studentCount: credits.length,
    avgCredits: credits.length ? Math.round(credits.reduce((a, b) => a + b, 0) / credits.length) : 0,
    bands: bands(credits),
    distribution: distribution(credits),
    byClass: classes.map(classView).map((c) => ({ classId: c.id, classCode: c.classCode, avgCredits: c.avgCredits, studentCount: c.studentCount })),
    atRiskStudents: db.students.filter((s) => ids.has(s.classId)).map(studentView)
      .filter((s) => (s.earnedCredits / TOTAL_REQUIRED_CREDITS) * 100 < 40)
      .sort((a, b) => a.earnedCredits - b.earnedCredits).slice(0, 6),
  };
});
on('GET', '/teacher/classes/:classId', (u, _, p) => { authorize(u, 'teacher', 'admin'); return classView(classOwnership(u, p.classId)); }, true);
on('GET', '/teacher/classes/:classId/students', (u, _, p) => {
  authorize(u, 'teacher', 'admin');
  const cls = classOwnership(u, p.classId);
  return db.students.filter((s) => s.classId === cls.id).sort((a, b) => a.studentCode.localeCompare(b.studentCode)).map(studentView);
}, true);
on('POST', '/teacher/classes/:classId/students', (u, body, p) => {
  authorize(u, 'teacher', 'admin');
  const cls = classOwnership(u, p.classId);
  return createStudent({ ...body, classId: cls.id });
}, true);
on('PUT', '/teacher/classes/:classId/students/:id', (u, body, p) => {
  authorize(u, 'teacher', 'admin');
  const cls = classOwnership(u, p.classId);
  const st = db.students.find((s) => s.id === Number(p.id) && s.classId === cls.id);
  if (!st) throw new MockError(404, 'Không tìm thấy sinh viên trong lớp này');
  const { classId, ...rest } = body; // giáo viên không chuyển lớp
  return updateStudent(st, rest);
}, true);
on('DELETE', '/teacher/classes/:classId/students/:id', (u, _, p) => {
  authorize(u, 'teacher', 'admin');
  const cls = classOwnership(u, p.classId);
  const st = db.students.find((s) => s.id === Number(p.id) && s.classId === cls.id);
  if (!st) throw new MockError(404, 'Không tìm thấy sinh viên trong lớp này');
  removeStudent(st);
  return null;
}, true);
on('GET', '/teacher/classes/:classId/students/:id/results', (u, _, p) => {
  authorize(u, 'teacher', 'admin');
  const cls = classOwnership(u, p.classId);
  const st = db.students.find((s) => s.id === Number(p.id) && s.classId === cls.id);
  if (!st) throw new MockError(404, 'Không tìm thấy sinh viên trong lớp này');
  return resultsOf(st);
}, true);
on('PUT', '/teacher/classes/:classId/students/:id/results', (u, body, p) => {
  authorize(u, 'teacher', 'admin');
  const cls = classOwnership(u, p.classId);
  const st = db.students.find((s) => s.id === Number(p.id) && s.classId === cls.id);
  if (!st) throw new MockError(404, 'Không tìm thấy sinh viên trong lớp này');
  for (const r of body?.results || []) {
    const score = r.score === null || r.score === '' ? null : Number(r.score);
    if (score !== null && (Number.isNaN(score) || score < 0 || score > 10)) throw new MockError(422, 'Điểm phải trong khoảng 0–10');
    const existing = db.studentCourses.find((sc) => sc.studentId === st.id && sc.courseId === Number(r.courseId));
    if (score === null) {
      if (existing) db.studentCourses = db.studentCourses.filter((sc) => sc !== existing);
    } else if (existing) existing.score = score;
    else db.studentCourses.push({ id: nextId('studentCourses'), studentId: st.id, courseId: Number(r.courseId), score });
  }
  save();
  return resultsOf(st);
}, true);

// Quản trị
on('GET', '/admin/stats', (u) => {
  authorize(u, 'admin');
  const credits = db.students.map((s) => earnedCredits(s.id));
  const roleCount = (r) => db.users.filter((x) => x.role === r).length;
  return {
    counts: { classes: db.classes.length, teachers: db.teachers.length, students: db.students.length, courses: db.courses.length },
    avgCredits: credits.length ? Math.round(credits.reduce((a, b) => a + b, 0) / credits.length) : 0,
    bands: bands(credits),
    creditDistribution: distribution(credits),
    studentsPerClass: db.classes.map(classView).map((c) => ({ classCode: c.classCode, count: c.studentCount, avgCredits: c.avgCredits })),
    roles: [{ role: 'student', count: roleCount('student') }, { role: 'teacher', count: roleCount('teacher') }, { role: 'admin', count: roleCount('admin') }],
    accounts: { active: db.users.filter((x) => x.isActive).length, locked: db.users.filter((x) => !x.isActive).length, mustChangePassword: db.users.filter((x) => x.mustChangePassword).length },
    coursePassRate: db.courses.map((c) => {
      const rows = db.studentCourses.filter((sc) => sc.courseId === c.id);
      return { courseCode: c.courseCode, name: c.name, attempts: rows.length, passRate: rows.length ? Math.round((rows.filter((r) => r.score >= PASS_SCORE).length / rows.length) * 100) : null };
    }).filter((c) => c.attempts >= 5).sort((a, b) => a.passRate - b.passRate).slice(0, 8),
    classesWithoutTeacher: db.classes.filter((c) => !c.teacherId).map(classView),
  };
}, true);

// Lớp
on('GET', '/admin/classes', (u) => { authorize(u, 'admin'); return db.classes.map(classView); }, true);
on('POST', '/admin/classes', (u, body) => {
  authorize(u, 'admin');
  required(body, ['classCode', 'name']);
  unique('classes', 'classCode', body.classCode);
  const c = { id: nextId('classes'), classCode: body.classCode, name: body.name, intakeYear: Number(body.intakeYear) || null, teacherId: body.teacherId ? Number(body.teacherId) : null };
  db.classes.push(c); save();
  return classView(c);
}, true);
on('PUT', '/admin/classes/:id', (u, body, p) => {
  authorize(u, 'admin');
  const c = mustFind('classes', p.id, 'Không tìm thấy lớp');
  required(body, ['classCode', 'name']);
  unique('classes', 'classCode', body.classCode, c.id);
  Object.assign(c, { classCode: body.classCode, name: body.name, intakeYear: Number(body.intakeYear) || c.intakeYear || null, teacherId: body.teacherId ? Number(body.teacherId) : null });
  save();
  return classView(c);
}, true);
on('DELETE', '/admin/classes/:id', (u, _, p) => {
  authorize(u, 'admin');
  const c = mustFind('classes', p.id, 'Không tìm thấy lớp');
  if (db.students.some((s) => s.classId === c.id)) throw new MockError(409, 'Lớp còn sinh viên, hãy chuyển hoặc xoá sinh viên trước');
  db.classes = db.classes.filter((x) => x.id !== c.id); save();
  return null;
}, true);

// Giáo viên
const teacherFull = (t) => {
  const user = find('users', t.userId);
  return { ...t, isActive: user?.isActive ?? true, username: user?.username, classes: db.classes.filter((c) => c.teacherId === t.id).map((c) => ({ id: c.id, classCode: c.classCode })) };
};
on('GET', '/admin/teachers', (u) => { authorize(u, 'admin'); return db.teachers.map(teacherFull); }, true);
on('POST', '/admin/teachers', (u, body) => {
  authorize(u, 'admin');
  required(body, ['teacherCode', 'fullName']);
  unique('teachers', 'teacherCode', body.teacherCode);
  unique('users', 'username', body.teacherCode.toLowerCase());
  const user = { id: nextId('users'), username: body.teacherCode.toLowerCase(), password: body.teacherCode.toLowerCase(), role: 'teacher', isActive: true, mustChangePassword: true, createdAt: now() };
  db.users.push(user);
  const t = { id: nextId('teachers'), userId: user.id, teacherCode: body.teacherCode, fullName: body.fullName, email: body.email || '' };
  db.teachers.push(t); save();
  return teacherFull(t);
}, true);
on('PUT', '/admin/teachers/:id', (u, body, p) => {
  authorize(u, 'admin');
  const t = mustFind('teachers', p.id, 'Không tìm thấy giáo viên');
  required(body, ['teacherCode', 'fullName']);
  unique('teachers', 'teacherCode', body.teacherCode, t.id);
  Object.assign(t, { teacherCode: body.teacherCode, fullName: body.fullName, email: body.email || '' });
  save();
  return teacherFull(t);
}, true);
on('DELETE', '/admin/teachers/:id', (u, _, p) => {
  authorize(u, 'admin');
  const t = mustFind('teachers', p.id, 'Không tìm thấy giáo viên');
  db.classes.forEach((c) => { if (c.teacherId === t.id) c.teacherId = null; });
  db.teachers = db.teachers.filter((x) => x.id !== t.id);
  db.users = db.users.filter((x) => x.id !== t.userId);
  save();
  return null;
}, true);

// Sinh viên (mọi lớp)
on('GET', '/admin/students', (u) => { authorize(u, 'admin'); return db.students.map(studentView).sort((a, b) => a.studentCode.localeCompare(b.studentCode)); }, true);
on('POST', '/admin/students', (u, body) => { authorize(u, 'admin'); return createStudent(body); }, true);
on('PUT', '/admin/students/:id', (u, body, p) => { authorize(u, 'admin'); return updateStudent(mustFind('students', p.id, 'Không tìm thấy sinh viên'), body); }, true);
on('DELETE', '/admin/students/:id', (u, _, p) => { authorize(u, 'admin'); removeStudent(mustFind('students', p.id, 'Không tìm thấy sinh viên')); return null; }, true);

// Môn học
const courseFull = (c) => ({ ...c, enrolled: db.studentCourses.filter((sc) => sc.courseId === c.id).length });
on('GET', '/admin/courses', (u) => { authorize(u, 'admin'); return db.courses.map(courseFull); }, true);
const courseBody = (body) => {
  required(body, ['courseCode', 'name', 'credits']);
  const credits = Number(body.credits);
  if (!Number.isInteger(credits) || credits < 1 || credits > 10) throw new MockError(422, 'Số tín chỉ phải là số nguyên 1–10');
  return { courseCode: body.courseCode, name: body.name, credits };
};
on('POST', '/admin/courses', (u, body) => {
  authorize(u, 'admin');
  const data = courseBody(body);
  unique('courses', 'courseCode', data.courseCode);
  const c = { id: nextId('courses'), ...data };
  db.courses.push(c); save();
  return courseFull(c);
}, true);
on('PUT', '/admin/courses/:id', (u, body, p) => {
  authorize(u, 'admin');
  const c = mustFind('courses', p.id, 'Không tìm thấy môn học');
  const data = courseBody(body);
  unique('courses', 'courseCode', data.courseCode, c.id);
  Object.assign(c, data); save();
  return courseFull(c);
}, true);
on('DELETE', '/admin/courses/:id', (u, _, p) => {
  authorize(u, 'admin');
  const c = mustFind('courses', p.id, 'Không tìm thấy môn học');
  db.studentCourses = db.studentCourses.filter((sc) => sc.courseId !== c.id);
  db.courses = db.courses.filter((x) => x.id !== c.id); save();
  return null;
}, true);

// Tài khoản & cấp quyền
const userRow = (x) => ({ id: x.id, username: x.username, role: x.role, isActive: x.isActive, mustChangePassword: !!x.mustChangePassword, fullName: profileOf(x)?.fullName || x.username, createdAt: x.createdAt });
on('GET', '/admin/users', (u) => { authorize(u, 'admin'); return db.users.map(userRow); }, true);
on('PATCH', '/admin/users/:id/role', (u, body, p) => {
  authorize(u, 'admin');
  const target = mustFind('users', p.id, 'Không tìm thấy tài khoản');
  if (!['student', 'teacher', 'admin'].includes(body?.role)) throw new MockError(422, 'Vai trò không hợp lệ');
  if (target.id === u.id) throw new MockError(400, 'Không thể tự đổi vai trò của chính mình');
  if (target.role === 'admin' && body.role !== 'admin' && db.users.filter((x) => x.role === 'admin').length <= 1) throw new MockError(400, 'Hệ thống phải còn ít nhất 1 quản trị viên');
  if (target.role === body.role) return userRow(target);
  const name = profileOf(target)?.fullName || target.username;
  // Gỡ hồ sơ cũ, tạo hồ sơ mới tương ứng vai trò
  if (target.role === 'teacher') {
    const t = db.teachers.find((x) => x.userId === target.id);
    if (t) { db.classes.forEach((c) => { if (c.teacherId === t.id) c.teacherId = null; }); db.teachers = db.teachers.filter((x) => x !== t); }
  }
  if (target.role === 'student') {
    const st = db.students.find((x) => x.userId === target.id);
    if (st) { db.studentCourses = db.studentCourses.filter((sc) => sc.studentId !== st.id); db.students = db.students.filter((x) => x !== st); }
  }
  if (body.role === 'teacher') db.teachers.push({ id: nextId('teachers'), userId: target.id, teacherCode: target.username.toUpperCase(), fullName: name, email: '' });
  if (body.role === 'student') db.students.push({ id: nextId('students'), userId: target.id, studentCode: target.username, fullName: name, dateOfBirth: null, email: '', classId: db.classes[0]?.id ?? null });
  if (body.role === 'admin') target.fullName = name;
  target.role = body.role;
  save();
  return userRow(target);
}, true);
on('PATCH', '/admin/users/:id/status', (u, body, p) => {
  authorize(u, 'admin');
  const target = mustFind('users', p.id, 'Không tìm thấy tài khoản');
  if (target.id === u.id) throw new MockError(400, 'Không thể tự khoá tài khoản của chính mình');
  target.isActive = !!body?.isActive; save();
  return userRow(target);
}, true);
on('POST', '/admin/users/:id/reset-password', (u, _, p) => {
  authorize(u, 'admin');
  const target = mustFind('users', p.id, 'Không tìm thấy tài khoản');
  target.password = target.username;
  target.mustChangePassword = true; save();
  return { message: `Đã đặt lại mật khẩu về mặc định (${target.username})` };
}, true);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Trả về { status, data } giống fetch thật. */
export async function mockFetch(path, { method = 'GET', body } = {}) {
  await sleep(180 + Math.random() * 220);
  const [pathname] = path.split('?');
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = pathname.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    try {
      const data = r.handler(r.needsAuth ? currentUser() : undefined, body, params);
      const status = data === null ? 204 : method === 'POST' && !pathname.startsWith('/auth') && !pathname.includes('reset-password') ? 201 : 200;
      return { status, data };
    } catch (e) {
      if (e instanceof MockError) return { status: e.status, data: { error: e.message, details: e.details } };
      console.error(e);
      return { status: 500, data: { error: 'Lỗi hệ thống' } };
    }
  }
  return { status: 404, data: { error: 'Không tìm thấy API' } };
}
