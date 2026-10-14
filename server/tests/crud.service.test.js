// Test cho lớp CRUD dùng chung: mọi resource (môn học, lớp, giáo viên, sinh viên) đều đi qua đây,
// chỉ khác nhau ở cấu hình (trường được phép sửa, phạm vi theo role, hook tạo/xoá tài khoản).
const { db, resetDb, createClass } = require('./helpers');
const createCrudService = require('../src/services/crud.service');
const AppError = require('../src/utils/AppError');

beforeEach(resetDb);

describe('createCrudService - cơ bản (Course)', () => {
  const courses = createCrudService(db.Course, {
    name: 'môn học',
    fields: ['courseCode', 'name', 'credits'],
    searchable: ['courseCode', 'name'],
    order: [['courseCode', 'ASC']],
  });

  test('create chỉ nhận các trường trong whitelist', async () => {
    const c = await courses.create({ id: 999, courseCode: 'IT001', name: 'Lập trình', credits: 3, hack: 1 });
    expect(c.id).not.toBe(999);
    expect(c.courseCode).toBe('IT001');
    expect(c.hack).toBeUndefined();
  });

  test('list sắp xếp theo order và tìm kiếm theo q', async () => {
    await courses.create({ courseCode: 'IT002', name: 'Cơ sở dữ liệu', credits: 3 });
    await courses.create({ courseCode: 'IT001', name: 'Lập trình', credits: 4 });
    expect((await courses.list()).map((c) => c.courseCode)).toEqual(['IT001', 'IT002']);
    expect((await courses.list({ q: 'dữ liệu' })).map((c) => c.courseCode)).toEqual(['IT002']);
  });

  test('get trả 404 khi không tồn tại', async () => {
    await expect(courses.get(123)).rejects.toMatchObject({ statusCode: 404 });
    await expect(courses.get(123)).rejects.toBeInstanceOf(AppError);
  });

  test('update chỉ sửa trường trong whitelist', async () => {
    const c = await courses.create({ courseCode: 'IT001', name: 'Lập trình', credits: 3 });
    const u = await courses.update(c.id, { name: 'Lập trình C', id: 777 });
    expect(u.id).toBe(c.id);
    expect(u.name).toBe('Lập trình C');
  });

  test('remove xoá bản ghi, xoá lần 2 trả 404', async () => {
    const c = await courses.create({ courseCode: 'IT001', name: 'Lập trình', credits: 3 });
    await courses.remove(c.id);
    expect(await db.Course.count()).toBe(0);
    await expect(courses.remove(c.id)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('createCrudService - phạm vi (scope) và hook (Student)', () => {
  let classA;
  let classB;
  const afterRemove = jest.fn();

  const students = createCrudService(db.Student, {
    name: 'sinh viên',
    fields: ['studentCode', 'fullName', 'email', 'dateOfBirth', 'classId'],
    hooks: {
      // giống student.service thật: tạo tài khoản trước, trong cùng transaction
      beforeCreate: async (data, { transaction }) => {
        const user = await db.User.create(
          { username: data.studentCode, passwordHash: 'x', role: 'student' },
          { transaction },
        );
        return { ...data, userId: user.id };
      },
      afterRemove,
    },
  });

  beforeEach(async () => {
    afterRemove.mockClear();
    classA = await createClass({ classCode: 'A' });
    classB = await createClass({ classCode: 'B' });
  });

  test('create ép giá trị scope, bỏ qua classId gửi lên', async () => {
    const s = await students.create({ studentCode: 'SV1', fullName: 'A', classId: classB.id }, { classId: classA.id });
    expect(s.classId).toBe(classA.id);
    expect(s.userId).toBeDefined();
  });

  test('list/get/update/remove không chạm được bản ghi ngoài scope', async () => {
    const s = await students.create({ studentCode: 'SV1', fullName: 'A' }, { classId: classB.id });
    const scopeA = { classId: classA.id };
    expect(await students.list({ scope: scopeA })).toHaveLength(0);
    await expect(students.get(s.id, scopeA)).rejects.toMatchObject({ statusCode: 404 });
    await expect(students.update(s.id, { fullName: 'X' }, scopeA)).rejects.toMatchObject({ statusCode: 404 });
    await expect(students.remove(s.id, scopeA)).rejects.toMatchObject({ statusCode: 404 });
  });

  test('update trong scope không cho đổi trường scope (không chuyển lớp)', async () => {
    const s = await students.create({ studentCode: 'SV1', fullName: 'A' }, { classId: classA.id });
    const u = await students.update(s.id, { fullName: 'B', classId: classB.id }, { classId: classA.id });
    expect(u.fullName).toBe('B');
    expect(u.classId).toBe(classA.id);
  });

  test('beforeCreate lỗi giữa chừng thì rollback toàn bộ (không còn user mồ côi)', async () => {
    await students.create({ studentCode: 'SV1', fullName: 'A' }, { classId: classA.id });
    // username trùng -> User.create trong hook ném lỗi unique
    await expect(students.create({ studentCode: 'SV1', fullName: 'B' }, { classId: classA.id })).rejects.toBeTruthy();
    expect(await db.User.count()).toBe(1);
    expect(await db.Student.count()).toBe(1);
  });

  test('audit: ghi audit_logs trong cùng transaction khi truyền meta.actorId', async () => {
    const audited = createCrudService(db.Course, { name: 'môn học', fields: ['courseCode', 'name', 'credits'], audit: 'courses' });
    const actor = await db.User.create({ username: 'admin', passwordHash: 'x', role: 'admin' });
    const meta = { actorId: actor.id, requestId: '11111111-1111-1111-1111-111111111111', ip: '127.0.0.1' };
    const c = await audited.create({ courseCode: 'IT1', name: 'A', credits: 3 }, {}, meta);
    await audited.update(c.id, { name: 'B' }, {}, meta);
    await audited.remove(c.id, {}, meta);
    const logs = await db.AuditLog.findAll({ order: [['id', 'ASC']] });
    expect(logs.map((l) => l.action)).toEqual(['COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_DELETED']);
    expect(logs[0]).toMatchObject({ actorId: actor.id, entityType: 'courses', entityId: c.id, ipAddress: '127.0.0.1' });
    expect(logs[2].oldValue).toMatchObject({ courseCode: 'IT1', name: 'B' });
  });

  test('afterRemove được gọi với bản ghi vừa xoá', async () => {
    const s = await students.create({ studentCode: 'SV1', fullName: 'A' }, { classId: classA.id });
    await students.remove(s.id, { classId: classA.id });
    expect(afterRemove).toHaveBeenCalledTimes(1);
    expect(afterRemove.mock.calls[0][0].id).toBe(s.id);
  });
});

describe('createCrudService - decorate', () => {
  const decorate = jest.fn(async (records) => records.map((r) => ({ ...r.get({ plain: true }), extra: 'x' })));
  const courses = createCrudService(db.Course, {
    name: 'môn học', fields: ['courseCode', 'name', 'credits'], order: [['courseCode', 'ASC']], decorate,
  });

  beforeEach(decorate.mockClear);

  test('list gọi decorate một lần cho cả mảng (tránh N+1)', async () => {
    await courses.create({ courseCode: 'A', name: 'A', credits: 1 });
    await courses.create({ courseCode: 'B', name: 'B', credits: 1 });
    decorate.mockClear();
    const out = await courses.list();
    expect(decorate).toHaveBeenCalledTimes(1);
    expect(decorate.mock.calls[0][0]).toHaveLength(2);
    expect(out.map((c) => c.extra)).toEqual(['x', 'x']);
  });

  test('get, create và update đều trả bản đã decorate', async () => {
    const c = await courses.create({ courseCode: 'A', name: 'A', credits: 1 });
    expect(c.extra).toBe('x');
    expect((await courses.get(c.id)).extra).toBe('x');
    expect((await courses.update(c.id, { name: 'B' })).extra).toBe('x');
  });
});
