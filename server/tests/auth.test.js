const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  app, db, request, PASSWORD, resetDb, createAdmin, createUser, createTeacher, createStudent, createClass, loginAs,
} = require('./helpers');

let cls;
beforeEach(async () => {
  await resetDb();
  cls = await createClass({ classCode: '24110CL1' });
});

const tokenCookie = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('token='));

describe('POST /api/auth/register (sinh viên tự đăng ký)', () => {
  const body = {
    studentCode: '24110331', fullName: 'Trần Lê Thái', email: 'thai@example.com', password: 'matkhau123', classCode: '24110CL1',
  };

  test('tạo tài khoản role student, mật khẩu được băm bcrypt, set cookie JWT', async () => {
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      username: '24110331',
      role: 'student',
      mustChangePassword: false,
      profile: {
        fullName: 'Trần Lê Thái', studentCode: '24110331', classId: cls.id, class: { id: cls.id, classCode: '24110CL1' },
      },
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(tokenCookie(res)).toMatch(/HttpOnly/i);

    const user = await db.User.findOne({ where: { username: '24110331' } });
    expect(user.passwordHash).not.toBe('matkhau123');
    expect(await bcrypt.compare('matkhau123', user.passwordHash)).toBe(true);
    expect(await db.Student.count({ where: { userId: user.id } })).toBe(1);
  });

  test('mã lớp không tồn tại trả 400, thiếu mã lớp trả 400', async () => {
    expect((await request(app).post('/api/auth/register').send({ ...body, classCode: 'KHONGCO' })).status).toBe(400);
    const { classCode, ...noClass } = body;
    expect((await request(app).post('/api/auth/register').send(noClass)).status).toBe(400);
    expect(await db.User.count()).toBe(0);
  });

  test('email đã có người dùng trả 409', async () => {
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send({ ...body, studentCode: '24110332' });
    expect(res.status).toBe(409);
  });

  test('không cho tự chọn role (luôn là student)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...body, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('student');
  });

  test('trùng MSSV trả 409', async () => {
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  test('thiếu trường / mật khẩu ngắn trả 400 kèm details', async () => {
    const res = await request(app).post('/api/auth/register').send({ studentCode: '', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'password' })]));
  });

  test('đăng ký xong dùng được ngay cho /api/auth/me', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(body);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.profile.studentId).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  test('đúng mật khẩu: 200, cookie httpOnly chứa JWT có id', async () => {
    const admin = await createAdmin();
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: admin.id, username: 'admin', role: 'admin' });
    const cookie = tokenCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    const token = cookie.split(';')[0].slice('token='.length);
    expect(jwt.verify(token, process.env.JWT_SECRET)).toMatchObject({ id: admin.id });
  });

  test('cập nhật last_login_at, trả mustChangePassword để React nhắc đổi mật khẩu', async () => {
    const admin = await createAdmin();
    expect(admin.lastLoginAt).toBeFalsy();
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: PASSWORD });
    expect(res.body.user.mustChangePassword).toBe(true);
    expect((await admin.reload()).lastLoginAt).toBeInstanceOf(Date);
  });

  test('sai mật khẩu hoặc sai username đều trả 401 cùng thông báo', async () => {
    await createAdmin();
    const a = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'sai' });
    const b = await request(app).post('/api/auth/login').send({ username: 'khongco', password: 'sai' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error).toBe(b.body.error);
  });

  test('tài khoản bị khoá trả 403', async () => {
    await createUser({ username: 'gv', role: 'teacher', isActive: false });
    const res = await request(app).post('/api/auth/login').send({ username: 'gv', password: PASSWORD });
    expect(res.status).toBe(403);
  });

  test('thiếu username/password trả 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me, POST /api/auth/logout', () => {
  test('chưa đăng nhập trả 401', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  test('token sai chữ ký trả 401', async () => {
    const fake = jwt.sign({ id: 1 }, 'secret-khac');
    const res = await request(app).get('/api/auth/me').set('Cookie', `token=${fake}`);
    expect(res.status).toBe(401);
  });

  test('chấp nhận cả header Authorization: Bearer (tiện test bằng Postman)', async () => {
    const admin = await createAdmin();
    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('me trả profile giáo viên (teacherId, teacherCode, fullName)', async () => {
    const { teacher } = await createTeacher({ code: 'GV01' });
    const agent = await loginAs('GV01');
    const res = await agent.get('/api/auth/me');
    expect(res.body.user).toMatchObject({
      role: 'teacher', profile: { teacherId: teacher.id, teacherCode: 'GV01', fullName: teacher.fullName },
    });
  });

  test('me trả profile sinh viên kèm lớp và giáo viên chủ nhiệm', async () => {
    const { teacher } = await createTeacher({ code: 'GV01', fullName: 'Cô Chủ Nhiệm' });
    const homeroom = await createClass({ classCode: 'K20A', teacherId: teacher.id });
    const { student } = await createStudent({ code: 'SV01', classId: homeroom.id });
    const res = await (await loginAs('SV01')).get('/api/auth/me');
    expect(res.body.user.profile).toMatchObject({
      studentId: student.id,
      studentCode: 'SV01',
      classId: homeroom.id,
      class: { id: homeroom.id, classCode: 'K20A', name: homeroom.name },
      homeroomTeacher: { fullName: 'Cô Chủ Nhiệm' },
    });
  });

  test('sinh viên lớp chưa có GVCN thì homeroomTeacher = null', async () => {
    const { student } = await createStudent({ code: 'SV01' });
    const res = await (await loginAs('SV01')).get('/api/auth/me');
    expect(res.body.user.profile.homeroomTeacher).toBeNull();
    expect(res.body.user.profile.studentId).toBe(student.id);
  });

  test('admin có profile.fullName', async () => {
    await createAdmin();
    const res = await (await loginAs('admin')).get('/api/auth/me');
    expect(res.body.user.profile.fullName).toBe('Quản trị viên');
  });

  test('tài khoản bị khoá sau khi đăng nhập thì token cũ hết tác dụng', async () => {
    const admin = await createAdmin();
    const agent = await loginAs('admin');
    await admin.update({ isActive: false });
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  test('logout xoá cookie, gọi me sau đó trả 401', async () => {
    await createAdmin();
    const agent = await loginAs('admin');
    expect((await agent.post('/api/auth/logout')).status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('PUT /api/auth/password', () => {
  test('đổi mật khẩu thành công thì đăng nhập bằng mật khẩu mới', async () => {
    await createAdmin();
    const agent = await loginAs('admin');
    const res = await agent.put('/api/auth/password').send({ currentPassword: PASSWORD, newPassword: 'moi123456' });
    expect(res.status).toBe(204);
    await expect(loginAs('admin', 'moi123456')).resolves.toBeDefined();
    await expect(loginAs('admin', PASSWORD)).rejects.toThrow();
    expect((await db.User.findOne({ where: { username: 'admin' } })).mustChangePassword).toBe(false);
  });

  test('mật khẩu hiện tại sai trả 400', async () => {
    await createAdmin();
    const agent = await loginAs('admin');
    const res = await agent.put('/api/auth/password').send({ currentPassword: 'sai', newPassword: 'moi123456' });
    expect(res.status).toBe(400);
  });
});

describe('GET /health', () => {
  test('trả 200 không cần đăng nhập', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  test('API không tồn tại trả 404 JSON', async () => {
    const res = await request(app).get('/api/khong-co');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
