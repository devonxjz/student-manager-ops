const {
  app, db, request, SEMESTER, resetDb, createAdmin, createTeacher, createClass, createStudent, createCourse, loginAs,
} = require('./helpers');

let gv1;
let gv2;
let myClass;
let otherClass;

beforeEach(async () => {
  await resetDb();
  const t1 = await createTeacher({ code: 'GV01' });
  const t2 = await createTeacher({ code: 'GV02' });
  myClass = await createClass({ classCode: 'K20A', teacherId: t1.teacher.id });
  otherClass = await createClass({ classCode: 'K20B', teacherId: t2.teacher.id });
  gv1 = await loginAs('GV01');
  gv2 = await loginAs('GV02');
});

const base = (cls) => `/api/teacher/classes/${cls.id}/students`;

describe('GET /api/teacher/classes', () => {
  test('giáo viên chỉ thấy lớp mình chủ nhiệm, kèm sĩ số', async () => {
    await createStudent({ classId: myClass.id });
    const res = await gv1.get('/api/teacher/classes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([expect.objectContaining({ classCode: 'K20A', studentCount: 1 })]);
  });

  test('admin thấy mọi lớp', async () => {
    await createAdmin();
    const res = await (await loginAs('admin')).get('/api/teacher/classes');
    expect(res.body).toHaveLength(2);
  });

  test('sinh viên bị chặn 403', async () => {
    await createStudent({ code: 'SV01', classId: myClass.id });
    expect((await (await loginAs('SV01')).get('/api/teacher/classes')).status).toBe(403);
  });
});

// Cho SV `earned` tín chỉ bằng 1 môn có đúng số tín chỉ đó (điểm 8)
let courseSeq = 0;
const giveCredits = async (student, earned) => {
  courseSeq += 1;
  const course = await createCourse({ courseCode: `C${courseSeq}`, name: `Môn ${courseSeq}`, credits: earned });
  await db.StudentCourse.create({ studentId: student.id, courseId: course.id, score: 8, semester: SEMESTER });
};

describe('Dữ liệu tín chỉ theo lớp (FE cần avgCredits, atRisk, earnedCredits)', () => {
  beforeEach(async () => {
    const { student: a } = await createStudent({ code: 'SV01', classId: myClass.id });
    const { student: b } = await createStudent({ code: 'SV02', classId: myClass.id });
    await giveCredits(a, 6); // 4% -> chậm tiến độ
    await giveCredits(b, 4);
    await giveCredits(b, 6);
  });

  test('GET /classes: studentCount, avgCredits, atRisk, teacher', async () => {
    const res = await gv1.get('/api/teacher/classes');
    expect(res.body[0]).toMatchObject({
      classCode: 'K20A', studentCount: 2, avgCredits: 8, atRisk: 2, teacher: { teacherCode: 'GV01' },
    });
  });

  test('GET /classes/:classId trả 1 lớp, chặn lớp của người khác', async () => {
    const ok = await gv1.get(`/api/teacher/classes/${myClass.id}`);
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ id: myClass.id, studentCount: 2 });
    expect((await gv1.get(`/api/teacher/classes/${otherClass.id}`)).status).toBe(403);
    expect((await gv1.get('/api/teacher/classes/9999')).status).toBe(404);
  });

  test('danh sách SV có earnedCredits, isActive, class', async () => {
    const res = await gv1.get(base(myClass));
    expect(res.body.map((s) => [s.studentCode, s.earnedCredits])).toEqual([['SV01', 6], ['SV02', 10]]);
    expect(res.body[0]).toMatchObject({ isActive: true, class: { classCode: 'K20A' } });
  });

  test('khoá tài khoản SV thì isActive = false trong danh sách', async () => {
    const sv = await db.User.findOne({ where: { username: 'SV01' } });
    await sv.update({ isActive: false });
    const res = await gv1.get(base(myClass));
    expect(res.body.find((s) => s.studentCode === 'SV01').isActive).toBe(false);
  });

  test('GET /teacher/stats: số liệu dashboard giáo viên chỉ trong lớp mình', async () => {
    await createStudent({ code: 'SV99', classId: otherClass.id }); // lớp khác, không được tính
    const res = await gv1.get('/api/teacher/stats');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      classCount: 1,
      studentCount: 2,
      avgCredits: 8,
      bands: { good: 0, warning: 0, danger: 2 },
      byClass: [{ classId: myClass.id, classCode: 'K20A', avgCredits: 8, studentCount: 2 }],
    });
    expect(res.body.distribution).toHaveLength(6);
    expect(res.body.distribution[0]).toEqual({ range: '0–29', count: 2 });
    expect(res.body.atRiskStudents.map((s) => s.studentCode)).toEqual(['SV01', 'SV02']); // ít tín chỉ trước
    expect(res.body.atRiskStudents[0]).toMatchObject({ earnedCredits: 6, classId: myClass.id, class: { classCode: 'K20A' } });
  });

  test('admin gọi /teacher/stats thì thấy mọi lớp', async () => {
    await createAdmin();
    const res = await (await loginAs('admin')).get('/api/teacher/stats');
    expect(res.body.classCount).toBe(2);
  });
});

describe('CRUD sinh viên lớp mình chủ nhiệm', () => {
  test('thêm SV: tạo kèm tài khoản username = MSSV, mật khẩu = MSSV', async () => {
    const res = await gv1.post(base(myClass)).send({ studentCode: 'SV100', fullName: 'Phạm Văn D', dateOfBirth: '2005-01-02' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ studentCode: 'SV100', classId: myClass.id });
    await expect(loginAs('SV100', 'SV100')).resolves.toBeDefined();
  });

  test('xem / sửa / xoá', async () => {
    const { student } = await createStudent({ code: 'SV01', classId: myClass.id });
    expect((await gv1.get(base(myClass))).body).toHaveLength(1);

    const upd = await gv1.put(`${base(myClass)}/${student.id}`).send({ studentCode: 'SV01', fullName: 'Tên mới', email: 'a@b.vn' });
    expect(upd.status).toBe(200);
    expect(upd.body.fullName).toBe('Tên mới');

    expect((await gv1.delete(`${base(myClass)}/${student.id}`)).status).toBe(204);
    expect(await db.Student.count()).toBe(0);
    expect(await db.User.findByPk(student.userId)).toBeNull(); // xoá luôn tài khoản
  });

  test('thêm/sửa/xoá SV đều ghi audit_logs kèm người thực hiện', async () => {
    const gvUser = await db.User.findOne({ where: { username: 'GV01' } });
    const created = await gv1.post(base(myClass)).send({ studentCode: 'SV100', fullName: 'A' });
    await gv1.put(`${base(myClass)}/${created.body.id}`).send({ studentCode: 'SV100', fullName: 'B' });
    await gv1.delete(`${base(myClass)}/${created.body.id}`);
    const logs = await db.AuditLog.findAll({ where: { entityType: 'students' }, order: [['id', 'ASC']] });
    expect(logs.map((l) => l.action)).toEqual(['STUDENT_CREATED', 'STUDENT_UPDATED', 'STUDENT_DELETED']);
    expect(logs.every((l) => l.actorId === gvUser.id && l.entityId === created.body.id)).toBe(true);
    expect(logs[1].oldValue).toMatchObject({ fullName: 'A' });
    expect(logs[1].newValue).toMatchObject({ fullName: 'B' });
  });

  test('giáo viên không tự chuyển SV sang lớp khác được', async () => {
    const { student } = await createStudent({ code: 'SV01', classId: myClass.id });
    const res = await gv1.put(`${base(myClass)}/${student.id}`).send({ studentCode: 'SV01', fullName: 'X', classId: otherClass.id });
    expect(res.status).toBe(200);
    expect(res.body.classId).toBe(myClass.id);
  });

  test('email sai định dạng trả 400', async () => {
    const res = await gv1.post(base(myClass)).send({ studentCode: 'SV1', fullName: 'X', email: 'khong-phai-email' });
    expect(res.status).toBe(400);
  });
});

describe('Chặn thao tác lớp không chủ nhiệm (classOwnership)', () => {
  test('GV01 không xem/thêm/sửa/xoá được SV lớp của GV02 (403)', async () => {
    const { student } = await createStudent({ code: 'SV02', classId: otherClass.id });
    expect((await gv1.get(base(otherClass))).status).toBe(403);
    expect((await gv1.post(base(otherClass)).send({ studentCode: 'SVX', fullName: 'X' })).status).toBe(403);
    expect((await gv1.put(`${base(otherClass)}/${student.id}`).send({ studentCode: 'SV02', fullName: 'X' })).status).toBe(403);
    expect((await gv1.delete(`${base(otherClass)}/${student.id}`)).status).toBe(403);
    expect(await db.Student.count()).toBe(1);
  });

  test('dùng classId lớp mình nhưng id SV lớp khác trả 404', async () => {
    const { student } = await createStudent({ code: 'SV02', classId: otherClass.id });
    expect((await gv1.delete(`${base(myClass)}/${student.id}`)).status).toBe(404);
  });

  test('lớp không tồn tại trả 404', async () => {
    expect((await gv1.get('/api/teacher/classes/9999/students')).status).toBe(404);
  });

  test('admin thao tác được mọi lớp', async () => {
    await createAdmin();
    const admin = await loginAs('admin');
    const res = await admin.post(base(otherClass)).send({ studentCode: 'SV77', fullName: 'Y' });
    expect(res.status).toBe(201);
  });
});

describe('Nhập điểm /results', () => {
  let student;
  let c1;
  let c2;

  beforeEach(async () => {
    ({ student } = await createStudent({ code: 'SV01', classId: myClass.id }));
    c1 = await createCourse({ courseCode: 'IT001', credits: 3 });
    c2 = await createCourse({ courseCode: 'IT002', credits: 4 });
  });

  const url = () => `${base(myClass)}/${student.id}/results`;
  const put = (results) => gv1.put(url()).send({ results });

  test('GET: student kèm lớp, total, passScore, courses (mọi môn, chưa có điểm = null)', async () => {
    const res = await gv1.get(url());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total: 150,
      passScore: 5,
      student: { id: student.id, studentCode: 'SV01', class: { classCode: 'K20A' } },
    });
    expect(res.body.courses).toHaveLength(2);
    expect(res.body.courses[0]).toMatchObject({
      courseId: c1.id, courseCode: 'IT001', name: 'Nhập môn lập trình', credits: 3, score: null, passed: false,
    });
  });

  test('PUT chỉ cần { courseId, score }: học kỳ tự lấy theo ngày hiện tại, ghi người nhập', async () => {
    const res = await put([{ courseId: c1.id, score: 8.5 }, { courseId: c2.id, score: 4 }]);
    expect(res.status).toBe(200);
    expect(res.body.credits.earned).toBe(3);
    expect(res.body.courses[0]).toMatchObject({ score: 8.5, passed: true });
    expect(res.body.courses[1]).toMatchObject({ score: 4, passed: false });

    const gvUser = await db.User.findOne({ where: { username: 'GV01' } });
    const row = await db.StudentCourse.findOne({ where: { courseId: c1.id } });
    expect(row.semester).toMatch(/^\d{4}-[1-3]$/);
    expect(row.gradedBy).toBe(gvUser.id);
    expect(row.gradedAt).toBeInstanceOf(Date);
  });

  test('sửa điểm giữ nguyên học kỳ cũ, hoặc đổi nếu gửi semester', async () => {
    await put([{ courseId: c1.id, semester: '2025-1', score: 4 }]);
    await put([{ courseId: c1.id, score: 7 }]);
    expect(await db.StudentCourse.findOne({ where: { courseId: c1.id } })).toMatchObject({ semester: '2025-1', score: 7 });
    await put([{ courseId: c1.id, semester: '2026-2', score: 9 }]);
    expect(await db.StudentCourse.findOne({ where: { courseId: c1.id } })).toMatchObject({ semester: '2026-2', score: 9 });
    expect((await put([{ courseId: c2.id, score: 6 }])).body.credits.earned).toBe(3 + 4);
  });

  test('score = null hoặc "" xoá điểm môn đó (FE gửi khi ô điểm để trống)', async () => {
    await put([{ courseId: c1.id, score: 9 }, { courseId: c2.id, score: 9 }]);
    const res = await put([{ courseId: c1.id, score: null }, { courseId: c2.id, score: '' }]);
    expect(res.body.credits.earned).toBe(0);
    expect(res.body.courses.every((c) => c.score === null)).toBe(true);
    expect(await db.StudentCourse.count()).toBe(0);
  });

  test('score = null cho môn chưa có điểm là không làm gì (không tạo dòng rỗng)', async () => {
    expect((await put([{ courseId: c1.id, score: null }])).status).toBe(200);
    expect(await db.StudentCourse.count()).toBe(0);
  });

  test('nhập điểm ghi audit RESULTS_UPDATED', async () => {
    await put([{ courseId: c1.id, score: 9 }]);
    expect(await db.AuditLog.count({ where: { action: 'RESULTS_UPDATED', entityId: student.id } })).toBe(1);
  });

  test('điểm ngoài 0..10, semester sai định dạng, môn không tồn tại đều trả 400', async () => {
    expect((await put([{ courseId: c1.id, score: 11 }])).status).toBe(400);
    expect((await put([{ courseId: c1.id, score: -1 }])).status).toBe(400);
    expect((await put([{ courseId: c1.id, score: 'abc' }])).status).toBe(400);
    expect((await put([{ courseId: c1.id, semester: '2026-4', score: 5 }])).status).toBe(400);
    expect((await put([{ courseId: 999, score: 5 }])).status).toBe(400);
    expect(await db.StudentCourse.count()).toBe(0);
  });

  test('GV02 không nhập điểm được cho SV lớp GV01', async () => {
    expect((await gv2.put(url()).send({ results: [{ courseId: c1.id, score: 9 }] })).status).toBe(403);
  });
});

describe('GET /api/me/credits (sinh viên)', () => {
  test('trả tín chỉ đã đạt / 150 và danh sách môn đạt (điểm >= 5)', async () => {
    const { student } = await createStudent({ code: 'SV01', classId: myClass.id });
    const c1 = await createCourse({ courseCode: 'IT001', credits: 3 });
    const c2 = await createCourse({ courseCode: 'IT002', credits: 4 });
    const c3 = await createCourse({ courseCode: 'IT003', credits: 2 });
    await db.StudentCourse.bulkCreate([
      { studentId: student.id, courseId: c1.id, score: 5, semester: SEMESTER },
      { studentId: student.id, courseId: c2.id, score: 9.25, semester: SEMESTER },
      { studentId: student.id, courseId: c3.id, score: 4.99, semester: SEMESTER },
    ]);
    const res = await (await loginAs('SV01')).get('/api/me/credits');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ earned: 7, total: 150, percent: 5 });
    expect(res.body.courses.map((c) => c.code)).toEqual(['IT001', 'IT002']);
    expect(res.body.failedCourses).toEqual([expect.objectContaining({ code: 'IT003', credits: 2, score: 4.99 })]);
  });

  test('giáo viên gọi /api/me/credits bị 403', async () => {
    expect((await gv1.get('/api/me/credits')).status).toBe(403);
  });

  test('chưa đăng nhập 401', async () => {
    expect((await request(app).get('/api/me/credits')).status).toBe(401);
  });
});
