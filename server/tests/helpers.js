const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const db = require('../src/models');

const PASSWORD = 'secret123';

const resetDb = () => db.sequelize.sync({ force: true });

const createUser = async ({ username, role, password = PASSWORD, isActive = true }) =>
  db.User.create({ username, role, isActive, passwordHash: await bcrypt.hash(password, 4) });

const createAdmin = (username = 'admin') => createUser({ username, role: 'admin' });

const createTeacher = async ({ code = 'GV01', fullName = 'Nguyễn Văn Giáo' } = {}) => {
  const user = await createUser({ username: code, role: 'teacher' });
  const teacher = await db.Teacher.create({ userId: user.id, teacherCode: code, fullName });
  return { user, teacher };
};

const createClass = ({ classCode = 'CNTT-K20A', name = 'CNTT K20 A', intakeYear = 2024, teacherId = null } = {}) =>
  db.Class.create({ classCode, name, intakeYear, teacherId });

// students.class_id NOT NULL: không truyền lớp thì tự tạo 1 lớp riêng
let autoClassSeq = 0;
const ensureClassId = async (classId) => classId
  || (await createClass({ classCode: `AUTO-${(autoClassSeq += 1)}`, name: 'Lớp tự tạo' })).id;

const createStudent = async ({ code = 'SV001', fullName = 'Trần Thị Sinh', classId } = {}) => {
  const user = await createUser({ username: code, role: 'student' });
  const student = await db.Student.create({
    userId: user.id, studentCode: code, fullName, classId: await ensureClassId(classId),
  });
  return { user, student };
};

const createCourse = ({ courseCode = 'IT001', name = 'Nhập môn lập trình', credits = 3 } = {}) =>
  db.Course.create({ courseCode, name, credits });

const SEMESTER = '2026-1';

// Trả về supertest agent đã đăng nhập (cookie token được giữ lại cho các request sau)
const loginAs = async (username, password = PASSWORD) => {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ username, password });
  if (res.status !== 200) throw new Error(`Đăng nhập ${username} thất bại: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
};

module.exports = {
  app, db, request, PASSWORD, SEMESTER,
  resetDb, createUser, createAdmin, createTeacher, createClass, createStudent, createCourse, loginAs,
};
