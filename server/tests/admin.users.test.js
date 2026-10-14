const {
  db, PASSWORD, resetDb, createAdmin, createUser, createTeacher, createStudent, createClass, loginAs,
} = require('./helpers');

let adminUser;
let admin;

beforeEach(async () => {
  await resetDb();
  adminUser = await createAdmin();
  admin = await loginAs('admin');
});

describe('GET /api/admin/users', () => {
  test('mỗi dòng phẳng: fullName (từ hồ sơ), createdAt, mustChangePassword', async () => {
    await createTeacher({ code: 'GV01', fullName: 'Nguyễn Văn Giáo' });
    const res = await admin.get('/api/admin/users?role=teacher');
    expect(res.body[0]).toMatchObject({
      username: 'GV01', role: 'teacher', isActive: true, mustChangePassword: true, fullName: 'Nguyễn Văn Giáo',
    });
    expect(res.body[0].createdAt).toBeDefined();
    expect(res.body[0].teacher).toBeUndefined();
  });

  test('liệt kê tài khoản, lọc theo role, không lộ passwordHash', async () => {
    await createTeacher({ code: 'GV01' });
    await createStudent({ code: 'SV01' });
    const all = await admin.get('/api/admin/users');
    expect(all.body).toHaveLength(3);
    expect(JSON.stringify(all.body)).not.toMatch(/passwordHash|password_hash/);
    const teachers = await admin.get('/api/admin/users?role=teacher');
    expect(teachers.body.map((u) => u.username)).toEqual(['GV01']);
  });
});

describe('PATCH /api/admin/users/:id/role (cấp quyền)', () => {
  test('nâng student thành teacher: xoá hồ sơ SV, tạo hồ sơ GV giữ họ tên', async () => {
    const cls = await createClass();
    const { user } = await createStudent({ code: 'SV01', fullName: 'Ngô Thị E', classId: cls.id });
    const res = await admin.patch(`/api/admin/users/${user.id}/role`).send({ role: 'teacher' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ role: 'teacher', fullName: 'Ngô Thị E', username: 'SV01' });
    expect(await db.Student.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.Teacher.findOne({ where: { userId: user.id } })).toMatchObject({ teacherCode: 'SV01', fullName: 'Ngô Thị E' });
  });

  test('đổi thành student bắt buộc có classId, tạo hồ sơ SV trong lớp đó', async () => {
    const cls = await createClass();
    const { user } = await createTeacher({ code: 'GV01', fullName: 'Lý Văn F' });
    expect((await admin.patch(`/api/admin/users/${user.id}/role`).send({ role: 'student' })).status).toBe(400);
    const res = await admin.patch(`/api/admin/users/${user.id}/role`).send({ role: 'student', classId: cls.id });
    expect(res.status).toBe(200);
    expect(await db.Student.findOne({ where: { userId: user.id } })).toMatchObject({ classId: cls.id, fullName: 'Lý Văn F' });
    expect(await db.Teacher.count()).toBe(0);
  });

  test('đổi role ghi audit USER_ROLE_CHANGED (old/new value)', async () => {
    const { user } = await createTeacher({ code: 'GV01' });
    await admin.patch(`/api/admin/users/${user.id}/role`).send({ role: 'admin' });
    const log = await db.AuditLog.findOne({ where: { action: 'USER_ROLE_CHANGED' } });
    expect(log).toMatchObject({ actorId: adminUser.id, entityType: 'users', entityId: user.id });
    expect(log.oldValue).toEqual({ role: 'teacher' });
    expect(log.newValue).toEqual({ role: 'admin' });
  });

  test('nâng teacher thành admin: xoá hồ sơ GV', async () => {
    const { user } = await createTeacher({ code: 'GV01' });
    await admin.patch(`/api/admin/users/${user.id}/role`).send({ role: 'admin' });
    expect(await db.Teacher.count()).toBe(0);
  });

  test('role đã đổi có hiệu lực ngay với token đang dùng', async () => {
    const { user } = await createTeacher({ code: 'GV01' });
    const gv = await loginAs('GV01');
    await admin.patch(`/api/admin/users/${user.id}/role`).send({ role: 'admin' });
    expect((await gv.get('/api/admin/stats')).status).toBe(200);
  });

  test('role không hợp lệ trả 400', async () => {
    const { user } = await createTeacher();
    expect((await admin.patch(`/api/admin/users/${user.id}/role`).send({ role: 'root' })).status).toBe(400);
  });

  test('admin không tự hạ quyền chính mình', async () => {
    const res = await admin.patch(`/api/admin/users/${adminUser.id}/role`).send({ role: 'teacher' });
    expect(res.status).toBe(400);
  });

  test('hạ quyền admin khác được (vì vẫn còn chính mình là admin)', async () => {
    const other = await createUser({ username: 'admin2', role: 'admin' });
    const res = await admin.patch(`/api/admin/users/${other.id}/role`).send({ role: 'teacher' });
    expect(res.status).toBe(200);
    expect(await db.User.count({ where: { role: 'admin', isActive: true } })).toBe(1);
  });
});

describe('PATCH /api/admin/users/:id/status', () => {
  test('khoá tài khoản thì không đăng nhập được, mở lại thì được', async () => {
    const { user } = await createTeacher({ code: 'GV01' });
    expect((await admin.patch(`/api/admin/users/${user.id}/status`).send({ isActive: false })).status).toBe(200);
    await expect(loginAs('GV01')).rejects.toThrow();
    await admin.patch(`/api/admin/users/${user.id}/status`).send({ isActive: true });
    await expect(loginAs('GV01')).resolves.toBeDefined();
  });

  test('trả về dòng người dùng đã cập nhật', async () => {
    const { user } = await createTeacher({ code: 'GV01' });
    const res = await admin.patch(`/api/admin/users/${user.id}/status`).send({ isActive: false });
    expect(res.body).toMatchObject({ id: user.id, isActive: false, fullName: 'Nguyễn Văn Giáo' });
  });

  test('admin không tự khoá chính mình', async () => {
    expect((await admin.patch(`/api/admin/users/${adminUser.id}/status`).send({ isActive: false })).status).toBe(400);
  });

  test('isActive phải là boolean', async () => {
    const { user } = await createTeacher();
    expect((await admin.patch(`/api/admin/users/${user.id}/status`).send({ isActive: 'abc' })).status).toBe(400);
  });
});

describe('POST /api/admin/users/:id/reset-password', () => {
  test('mặc định đặt lại mật khẩu = username', async () => {
    const { user } = await createTeacher({ code: 'GV01' });
    const res = await admin.post(`/api/admin/users/${user.id}/reset-password`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/GV01/);
    await expect(loginAs('GV01', 'GV01')).resolves.toBeDefined();
    await expect(loginAs('GV01', PASSWORD)).rejects.toThrow();
    expect((await user.reload()).mustChangePassword).toBe(true);
  });

  test('có thể chỉ định mật khẩu mới', async () => {
    const { user } = await createTeacher({ code: 'GV01' });
    await admin.post(`/api/admin/users/${user.id}/reset-password`).send({ newPassword: 'reset1234' });
    await expect(loginAs('GV01', 'reset1234')).resolves.toBeDefined();
  });

  test('user không tồn tại trả 404', async () => {
    expect((await admin.post('/api/admin/users/9999/reset-password')).status).toBe(404);
  });
});
