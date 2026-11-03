// Tạo dữ liệu demo: 1 lớp, 1 giáo viên chủ nhiệm, 1 sinh viên.
// Chạy lại nhiều lần không tạo trùng. Mật khẩu lấy từ biến môi trường, không ghi vào code.
// Cách dùng (CloudShell tab sms-dev-admin, đã có DB_* và DB_SSL=true):
//   DEMO_TEACHER_PASSWORD=... DEMO_STUDENT_PASSWORD=... node scripts/seed-demo.js
require('dotenv').config();
const db = require('../src/models');
const { createAccount } = require('../src/services/auth.service');
const logger = require('../src/utils/logger');

const CLASS = { classCode: '24110CL1', name: 'Lớp demo 24110CL1', intakeYear: 2024 };
const TEACHER = { username: 'gv001', fullName: 'Giáo viên Demo', teacherCode: 'gv001' };
const STUDENT = { username: 'SV001', fullName: 'Sinh viên Demo', studentCode: 'SV001' };

async function main() {
  const teacherPassword = process.env.DEMO_TEACHER_PASSWORD;
  const studentPassword = process.env.DEMO_STUDENT_PASSWORD;
  if (!teacherPassword || !studentPassword) {
    throw new Error('Thiếu DEMO_TEACHER_PASSWORD hoặc DEMO_STUDENT_PASSWORD');
  }

  const [cls] = await db.Class.findOrCreate({ where: { classCode: CLASS.classCode }, defaults: CLASS });

  // Giáo viên: tài khoản + hồ sơ, gán làm chủ nhiệm lớp
  let teacherUser = await db.User.findOne({ where: { username: TEACHER.username } });
  if (!teacherUser) {
    teacherUser = await createAccount({
      username: TEACHER.username, password: teacherPassword, role: 'teacher', mustChangePassword: false,
    });
    await db.Teacher.create({ userId: teacherUser.id, teacherCode: TEACHER.teacherCode, fullName: TEACHER.fullName });
    logger.info(`Đã tạo giáo viên "${TEACHER.username}"`);
  } else {
    logger.info(`Giáo viên "${TEACHER.username}" đã tồn tại, bỏ qua`);
  }
  const teacher = await db.Teacher.findOne({ where: { userId: teacherUser.id } });
  if (cls.teacherId !== teacher.id) {
    await cls.update({ teacherId: teacher.id });
    logger.info(`Đã gán "${TEACHER.username}" làm chủ nhiệm ${CLASS.classCode}`);
  }

  // Sinh viên: tài khoản + hồ sơ, thuộc lớp demo
  const studentUser = await db.User.findOne({ where: { username: STUDENT.username } });
  if (!studentUser) {
    const user = await createAccount({
      username: STUDENT.username, password: studentPassword, role: 'student', mustChangePassword: false,
    });
    await db.Student.create({
      userId: user.id, studentCode: STUDENT.studentCode, fullName: STUDENT.fullName, classId: cls.id,
    });
    logger.info(`Đã tạo sinh viên "${STUDENT.username}"`);
  } else {
    logger.info(`Sinh viên "${STUDENT.username}" đã tồn tại, bỏ qua`);
  }
}

main()
  .catch((e) => { logger.error('Seed demo thất bại', { error: e.message }); process.exitCode = 1; })
  .finally(() => db.sequelize.close());
