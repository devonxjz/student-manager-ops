const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  sequelize, User, Teacher, Student, Class,
} = require('../models');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');

const INVALID_LOGIN = 'Sai tên đăng nhập hoặc mật khẩu';
// Hash giả để so sánh khi username không tồn tại -> thời gian phản hồi như nhau, không dò được username
const DUMMY_HASH = bcrypt.hashSync('dummy-password', bcryptRounds);

const hashPassword = (plain) => bcrypt.hash(plain, bcryptRounds);

const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

const verifyToken = (token) => jwt.verify(token, jwtSecret);

// Tạo tài khoản đăng nhập. Dùng chung cho đăng ký, admin tạo giáo viên, giáo viên tạo sinh viên.
// mustChangePassword mặc định true (mật khẩu do người khác đặt), tự đăng ký thì false.
const createAccount = async ({
  username, password, role, email = null, mustChangePassword = true,
}, { transaction } = {}) => User.create({
  username, role, email: email || null, mustChangePassword, passwordHash: await hashPassword(password),
}, { transaction });

// Thông tin user gửi cho React: { id, username, role, ..., profile }. Chính object này cũng là req.user,
// nên quyền theo dữ liệu đọc từ req.user.profile.teacherId / studentId / classId.
const FALLBACK_NAME = { admin: 'Quản trị viên' };

const buildProfile = (user) => {
  const t = user.teacher;
  const s = user.student;
  if (t) {
    return {
      fullName: t.fullName, email: t.email, phone: t.phone, department: t.department, teacherCode: t.teacherCode, teacherId: t.id,
    };
  }
  if (s) {
    const cls = s.class;
    const homeroom = cls && cls.teacher;
    return {
      fullName: s.fullName,
      email: s.email,
      studentCode: s.studentCode,
      dateOfBirth: s.dateOfBirth,
      studentId: s.id,
      classId: s.classId,
      class: cls ? { id: cls.id, classCode: cls.classCode, name: cls.name } : null,
      homeroomTeacher: homeroom ? { fullName: homeroom.fullName, email: homeroom.email } : null,
    };
  }
  return { fullName: FALLBACK_NAME[user.role] || user.username, email: user.email };
};

const toProfile = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
  profile: buildProfile(user),
});

const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      { model: Teacher, as: 'teacher' },
      { model: Student, as: 'student', include: [{ model: Class, as: 'class', include: [{ model: Teacher, as: 'teacher' }] }] },
    ],
  });
  return user ? toProfile(user) : null;
};

// Sinh viên tự đăng ký: luôn role student, username = MSSV, chọn lớp bằng mã lớp
// (students.class_id NOT NULL nên bắt buộc có lớp).
const register = async ({
  studentCode, fullName, email, dateOfBirth, password, classCode,
}) => {
  const cls = await Class.findOne({ where: { classCode } });
  if (!cls) throw new AppError('Mã lớp không tồn tại', 400);
  const user = await sequelize.transaction(async (transaction) => {
    const u = await createAccount({
      username: studentCode, password, role: ROLES.STUDENT, email, mustChangePassword: false,
    }, { transaction });
    await Student.create({
      userId: u.id, studentCode, fullName, email, dateOfBirth: dateOfBirth || null, classId: cls.id,
    }, { transaction });
    return u;
  });
  const profile = await getProfile(user.id);
  return { user: profile, token: signToken(profile) };
};

const login = async (username, password) => {
  const user = await User.findOne({ where: { username } });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw new AppError(INVALID_LOGIN, 401);
  if (!user.isActive) throw new AppError('Tài khoản đã bị khoá', 403);
  await user.update({ lastLoginAt: new Date() });
  return { user: await getProfile(user.id), token: signToken(user) };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Không tìm thấy tài khoản', 404);
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError('Mật khẩu hiện tại không đúng', 400);
  }
  await user.update({ passwordHash: await hashPassword(newPassword), mustChangePassword: false });
};

module.exports = {
  hashPassword, signToken, verifyToken, createAccount, getProfile, register, login, changePassword,
};
