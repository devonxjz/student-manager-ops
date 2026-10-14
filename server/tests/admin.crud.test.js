const bcrypt = require('bcryptjs');
const {
  app, db, request, SEMESTER, resetDb, createAdmin, createTeacher, createClass, createStudent, createCourse, loginAs,
} = require('./helpers');

let admin;

beforeEach(async () => {
  await resetDb();
  await createAdmin();
  admin = await loginAs('admin');
});

describe('Phân quyền nhóm /api/admin', () => {
  test('chưa đăng nhập 401, giáo viên/sinh viên 403', async () => {
    await createTeacher({ code: 'GV01' });
    await createStudent({ code: 'SV01' });
    expect((await request(app).get('/api/admin/courses')).status).toBe(401);
    expect((await (await loginAs('GV01')).get('/api/admin/courses')).status).toBe(403);
    expect((await (await loginAs('SV01')).get('/api/admin/courses')).status).toBe(403);
  });
});

describe('/api/admin/courses', () => {
  test('CRUD đầy đủ', async () => {
    const created = await admin.post('/api/admin/courses').send({ courseCode: 'IT001', name: 'Lập trình', credits: 3 });
    expect(created.status).toBe(201);
    const { id } = created.body;

    expect((await admin.get('/api/admin/courses')).body).toHaveLength(1);
    expect((await admin.get(`/api/admin/courses/${id}`)).body.name).toBe('Lập trình');

    const updated = await admin.put(`/api/admin/courses/${id}`).send({ courseCode: 'IT001', name: 'Lập trình C', credits: 4 });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ name: 'Lập trình C', credits: 4 });

    expect((await admin.delete(`/api/admin/courses/${id}`)).status).toBe(204);
    expect((await admin.get(`/api/admin/courses/${id}`)).status).toBe(404);
  });

  test('credits ngoài 1..10 trả 400, mã trùng trả 409', async () => {
    expect((await admin.post('/api/admin/courses').send({ courseCode: 'X', name: 'X', credits: 11 })).status).toBe(400);
    expect((await admin.post('/api/admin/courses').send({ courseCode: 'Y', name: 'Y', credits: 0 })).status).toBe(400);
    await createCourse({ courseCode: 'IT001' });
    expect((await admin.post('/api/admin/courses').send({ courseCode: 'IT001', name: 'Y', credits: 3 })).status).toBe(409);
  });

  test('không xoá được môn đã có điểm (409)', async () => {
    const course = await createCourse();
    const { student } = await createStudent();
    await db.StudentCourse.create({ studentId: student.id, courseId: course.id, score: 8, semester: SEMESTER });
    expect((await admin.delete(`/api/admin/courses/${course.id}`)).status).toBe(409);
  });

  test('ngừng mở môn bằng isActive = false (thay cho xoá)', async () => {
    const course = await createCourse();
    const res = await admin.put(`/api/admin/courses/${course.id}`).send({ courseCode: 'IT001', name: 'X', credits: 3, isActive: false });
    expect(res.body.isActive).toBe(false);
  });
});

describe('/api/admin/teachers', () => {
  test('tạo giáo viên kèm tài khoản (username = mã GV, mật khẩu mặc định = mã GV)', async () => {
    const res = await admin.post('/api/admin/teachers').send({
      teacherCode: 'GV09', fullName: 'Lê Văn C', email: 'c@x.vn', phone: '0901234567', department: 'Mạng máy tính',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ phone: '0901234567', department: 'Mạng máy tính' });
    const user = await db.User.findByPk(res.body.userId);
    expect(user).toMatchObject({ username: 'GV09', role: 'teacher', email: 'c@x.vn', mustChangePassword: true });
    expect(await bcrypt.compare('GV09', user.passwordHash)).toBe(true);
    await expect(loginAs('GV09', 'GV09')).resolves.toBeDefined();
  });

  test('có thể đặt mật khẩu ban đầu khác', async () => {
    await admin.post('/api/admin/teachers').send({ teacherCode: 'GV09', fullName: 'C', password: 'abc12345' });
    await expect(loginAs('GV09', 'abc12345')).resolves.toBeDefined();
  });

  test('sửa mã GV thì username đổi theo', async () => {
    const { teacher } = await createTeacher({ code: 'GV01' });
    const res = await admin.put(`/api/admin/teachers/${teacher.id}`).send({ teacherCode: 'GV99', fullName: 'Tên mới' });
    expect(res.status).toBe(200);
    expect((await db.User.findByPk(teacher.userId)).username).toBe('GV99');
  });

  test('xoá giáo viên thì xoá tài khoản, lớp đang chủ nhiệm thành chưa có GVCN', async () => {
    const { teacher } = await createTeacher({ code: 'GV01' });
    const cls = await createClass({ teacherId: teacher.id });
    expect((await admin.delete(`/api/admin/teachers/${teacher.id}`)).status).toBe(204);
    expect(await db.User.findByPk(teacher.userId)).toBeNull();
    expect((await cls.reload()).teacherId).toBeNull();
  });

  test('danh sách không lộ passwordHash', async () => {
    await createTeacher();
    const res = await admin.get('/api/admin/teachers');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|password_hash/);
  });
});

describe('/api/admin/classes', () => {
  test('tạo lớp và gán GVCN, list có kèm thông tin giáo viên + sĩ số', async () => {
    const { teacher } = await createTeacher();
    const res = await admin.post('/api/admin/classes').send({ classCode: 'K20A', name: 'Lớp A', intakeYear: 2024, teacherId: teacher.id });
    expect(res.status).toBe(201);
    await createStudent({ classId: res.body.id });

    const list = await admin.get('/api/admin/classes');
    expect(list.body[0]).toMatchObject({ classCode: 'K20A', teacher: { id: teacher.id }, studentCount: 1 });
  });

  test('gán teacherId không tồn tại trả 400', async () => {
    const res = await admin.post('/api/admin/classes').send({ classCode: 'K20A', name: 'Lớp A', intakeYear: 2024, teacherId: 999 });
    expect(res.status).toBe(400);
  });

  test('thiếu intakeYear hoặc ngoài 2000..2100 trả 400', async () => {
    expect((await admin.post('/api/admin/classes').send({ classCode: 'K20A', name: 'Lớp A' })).status).toBe(400);
    expect((await admin.post('/api/admin/classes').send({ classCode: 'K20A', name: 'Lớp A', intakeYear: 1999 })).status).toBe(400);
  });

  test('bỏ GVCN bằng teacherId = null', async () => {
    const { teacher } = await createTeacher();
    const cls = await createClass({ teacherId: teacher.id });
    const res = await admin.put(`/api/admin/classes/${cls.id}`).send({
      classCode: cls.classCode, name: cls.name, intakeYear: 2024, teacherId: null,
    });
    expect(res.body.teacherId).toBeNull();
  });

  test('không xoá được lớp còn sinh viên (409)', async () => {
    const cls = await createClass();
    await createStudent({ classId: cls.id });
    expect((await admin.delete(`/api/admin/classes/${cls.id}`)).status).toBe(409);
  });
});

describe('/api/admin/students', () => {
  test('tạo SV ở lớp bất kỳ và chuyển lớp', async () => {
    const a = await createClass({ classCode: 'A' });
    const b = await createClass({ classCode: 'B' });
    const res = await admin.post('/api/admin/students').send({ studentCode: 'SV01', fullName: 'X', classId: a.id });
    expect(res.status).toBe(201);
    const moved = await admin.put(`/api/admin/students/${res.body.id}`).send({ studentCode: 'SV01', fullName: 'X', classId: b.id });
    expect(moved.body.classId).toBe(b.id);
  });

  test('admin tạo SV bắt buộc có classId', async () => {
    expect((await admin.post('/api/admin/students').send({ studentCode: 'SV01', fullName: 'X' })).status).toBe(400);
  });

  test('gender/status sai giá trị trả 400', async () => {
    const a = await createClass();
    const base = { studentCode: 'SV01', fullName: 'X', classId: a.id };
    expect((await admin.post('/api/admin/students').send({ ...base, gender: 'abc' })).status).toBe(400);
    expect((await admin.post('/api/admin/students').send({ ...base, status: 'abc' })).status).toBe(400);
    const ok = await admin.post('/api/admin/students').send({ ...base, gender: 'female', status: 'suspended', phone: '0909' });
    expect(ok.body).toMatchObject({ gender: 'female', status: 'suspended', phone: '0909' });
  });

  test('lọc theo classId và tìm theo q', async () => {
    const a = await createClass({ classCode: 'A' });
    const b = await createClass({ classCode: 'B' });
    await createStudent({ code: 'SV01', fullName: 'Nguyễn An', classId: a.id });
    await createStudent({ code: 'SV02', fullName: 'Lê Bình', classId: b.id });
    expect((await admin.get(`/api/admin/students?classId=${a.id}`)).body.map((s) => s.studentCode)).toEqual(['SV01']);
    expect((await admin.get('/api/admin/students?q=Bình')).body.map((s) => s.studentCode)).toEqual(['SV02']);
  });
});

describe('Dữ liệu bổ sung cho các bảng admin', () => {
  test('courses: enrolled = số kết quả học tập của môn', async () => {
    const c = await createCourse();
    const { student } = await createStudent();
    await db.StudentCourse.create({ studentId: student.id, courseId: c.id, score: 8, semester: SEMESTER });
    const res = await admin.get('/api/admin/courses');
    expect(res.body[0]).toMatchObject({ courseCode: 'IT001', enrolled: 1 });
    expect((await admin.get(`/api/admin/courses/${c.id}`)).body.enrolled).toBe(1);
  });

  test('teachers: username, isActive và các lớp chủ nhiệm (phẳng)', async () => {
    const { teacher } = await createTeacher({ code: 'GV01' });
    await createClass({ classCode: 'A', teacherId: teacher.id });
    await createClass({ classCode: 'B', teacherId: teacher.id });
    const res = await admin.get('/api/admin/teachers');
    expect(res.body[0]).toMatchObject({ teacherCode: 'GV01', username: 'GV01', isActive: true });
    expect(res.body[0].classes.map((c) => c.classCode).sort()).toEqual(['A', 'B']);
    expect(res.body[0].user).toBeUndefined();
  });

  test('teachers: tạo mới trả đủ dạng như danh sách', async () => {
    const res = await admin.post('/api/admin/teachers').send({ teacherCode: 'GV09', fullName: 'C' });
    expect(res.body).toMatchObject({ username: 'GV09', isActive: true, classes: [] });
  });

  test('students: earnedCredits, isActive, class (phẳng, đủ cho bảng admin)', async () => {
    const cls = await createClass({ classCode: 'A' });
    const { student, user } = await createStudent({ classId: cls.id });
    const c = await createCourse({ credits: 5 });
    await db.StudentCourse.create({ studentId: student.id, courseId: c.id, score: 5, semester: SEMESTER });
    await user.update({ isActive: false });
    const res = await admin.get('/api/admin/students');
    expect(res.body[0]).toMatchObject({ earnedCredits: 5, isActive: false, class: { classCode: 'A' } });
    expect(res.body[0].user).toBeUndefined();
  });

  test('classes: avgCredits, atRisk, studentCount', async () => {
    const cls = await createClass({ classCode: 'A' });
    const { student } = await createStudent({ classId: cls.id });
    const c = await createCourse({ credits: 6 });
    await db.StudentCourse.create({ studentId: student.id, courseId: c.id, score: 9, semester: SEMESTER });
    const res = await admin.get('/api/admin/classes');
    expect(res.body[0]).toMatchObject({ studentCount: 1, avgCredits: 6, atRisk: 1 });
  });
});

describe('GET /api/admin/stats', () => {
  let a;
  let b;

  beforeEach(async () => {
    const { teacher } = await createTeacher();
    a = await createClass({ classCode: 'A', teacherId: teacher.id });
    b = await createClass({ classCode: 'B' });
    const s1 = (await createStudent({ code: 'SV01', classId: a.id })).student;
    const s2 = (await createStudent({ code: 'SV02', classId: a.id })).student;
    await createStudent({ code: 'SV03', classId: b.id });
    // SV01: 100 tín chỉ (67%), SV02: 4 tín chỉ, SV03: 0
    const big = await createCourse({ courseCode: 'BIG', credits: 6 });
    const small = await createCourse({ courseCode: 'SMALL', credits: 4 });
    for (let i = 0; i < 16; i += 1) {
      const c = await createCourse({ courseCode: `X${i}`, credits: 6 }); // 16 * 6 = 96, + SMALL 4 = 100
      await db.StudentCourse.create({ studentId: s1.id, courseId: c.id, score: 7, semester: SEMESTER });
    }
    await db.StudentCourse.create({ studentId: s1.id, courseId: small.id, score: 6, semester: SEMESTER });
    await db.StudentCourse.create({ studentId: s2.id, courseId: small.id, score: 5, semester: SEMESTER });
    await db.StudentCourse.create({ studentId: s2.id, courseId: big.id, score: 3, semester: SEMESTER }); // rớt
  });

  test('counts, avgCredits, bands, accounts, roles', async () => {
    const res = await admin.get('/api/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.counts).toEqual({ classes: 2, teachers: 1, students: 3, courses: 18 });
    expect(res.body.avgCredits).toBe(35); // (100 + 4 + 0) / 3
    expect(res.body.bands).toEqual({ good: 0, warning: 1, danger: 2 });
    expect(res.body.roles).toEqual(expect.arrayContaining([
      { role: 'student', count: 3 }, { role: 'teacher', count: 1 }, { role: 'admin', count: 1 },
    ]));
    expect(res.body.accounts).toEqual({ active: 5, locked: 0, mustChangePassword: 5 });
  });

  test('creditDistribution 6 khoảng, studentsPerClass, classesWithoutTeacher', async () => {
    const res = await admin.get('/api/admin/stats');
    expect(res.body.creditDistribution).toEqual([
      { range: '0–29', count: 2 }, { range: '30–59', count: 0 }, { range: '60–89', count: 0 },
      { range: '90–119', count: 1 }, { range: '120–149', count: 0 }, { range: '150+', count: 0 },
    ]);
    expect(res.body.studentsPerClass).toEqual([
      { classCode: 'A', count: 2, avgCredits: 52 }, { classCode: 'B', count: 1, avgCredits: 0 },
    ]);
    expect(res.body.classesWithoutTeacher.map((c) => c.classCode)).toEqual(['B']);
    expect(res.body.classesWithoutTeacher[0]).toMatchObject({ id: b.id, studentCount: 1 });
  });

  test('coursePassRate: chỉ môn có >= 5 lượt, % đạt tăng dần', async () => {
    const res = await admin.get('/api/admin/stats');
    expect(res.body.coursePassRate).toEqual([]); // chưa môn nào đủ 5 lượt
    const c = await createCourse({ courseCode: 'HOT', credits: 3 });
    const sts = await db.Student.findAll();
    for (let i = 0; i < 5; i += 1) {
      const { student } = await createStudent({ code: `P${i}`, classId: a.id });
      await db.StudentCourse.create({ studentId: student.id, courseId: c.id, score: i < 3 ? 8 : 2, semester: SEMESTER });
    }
    expect(sts.length).toBeGreaterThan(0);
    const after = await admin.get('/api/admin/stats');
    expect(after.body.coursePassRate).toEqual([{ courseCode: 'HOT', name: 'Nhập môn lập trình', attempts: 5, passRate: 60 }]);
  });

  test('khoá tài khoản được tính vào accounts.locked', async () => {
    await (await db.User.findOne({ where: { username: 'SV03' } })).update({ isActive: false });
    expect((await admin.get('/api/admin/stats')).body.accounts).toMatchObject({ active: 4, locked: 1 });
  });
});
