// Cấp quyền: đổi role, khoá/mở tài khoản, đặt lại mật khẩu (chỉ admin). Mọi thao tác đều ghi audit_logs.
const { Op } = require('sequelize');
const {
  sequelize, User, Teacher, Student, Class,
} = require('../models');
const { ROLES } = require('../config/constants');
const { hashPassword } = require('./auth.service');
const audit = require('./audit.service');
const AppError = require('../utils/AppError');

const findUser = async (id, options = {}) => {
  const user = await User.findByPk(id, options);
  if (!user) throw new AppError('Không tìm thấy tài khoản', 404);
  return user;
};

const isSelf = (meta, userId) => Number(meta.actorId) === Number(userId);

// Không cho làm mất admin hoạt động cuối cùng
const ensureAnotherActiveAdmin = async (user, transaction) => {
  if (user.role !== ROLES.ADMIN || !user.isActive) return;
  const others = await User.count({
    where: { role: ROLES.ADMIN, isActive: true, id: { [Op.ne]: user.id } }, transaction,
  });
  if (others === 0) throw new AppError('Phải còn ít nhất 1 quản trị viên', 400);
};

const profileIncludes = [
  { model: Teacher, as: 'teacher', attributes: ['id', 'fullName'] },
  { model: Student, as: 'student', attributes: ['id', 'fullName'] },
];

// Dòng phẳng cho bảng "Phân quyền": họ tên lấy từ hồ sơ, admin không có hồ sơ nên dùng nhãn chung
const toRow = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
  fullName: (user.teacher && user.teacher.fullName)
    || (user.student && user.student.fullName)
    || (user.role === ROLES.ADMIN ? 'Quản trị viên' : user.username),
  createdAt: user.createdAt,
});

const findRow = async (id) => toRow(await findUser(id, { include: profileIncludes }));

exports.list = async ({ role, q } = {}) => {
  const where = {};
  if (role) where.role = role;
  if (q) where[Op.or] = [{ username: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }];
  const users = await User.findAll({ where, order: [['username', 'ASC']], include: profileIncludes });
  return users.map(toRow);
};

// Đổi role: xoá hồ sơ cũ, tạo hồ sơ mới tương ứng (mã = username, giữ họ tên).
// Đổi sang student cần classId vì students.class_id NOT NULL.
exports.changeRole = async (userId, { role, classId }, meta = {}) => {
  if (isSelf(meta, userId)) throw new AppError('Không thể tự đổi quyền của chính mình', 400);

  await sequelize.transaction(async (transaction) => {
    const user = await findUser(userId, {
      include: [{ model: Teacher, as: 'teacher' }, { model: Student, as: 'student' }], transaction,
    });
    if (user.role === role) return;
    await ensureAnotherActiveAdmin(user, transaction);

    if (role === ROLES.STUDENT) {
      if (!classId) throw new AppError('Cần chọn lớp khi chuyển thành sinh viên', 400);
      if (!(await Class.findByPk(classId, { transaction }))) throw new AppError('Không tìm thấy lớp', 400);
    }

    const fullName = user.teacher?.fullName || user.student?.fullName || user.username;
    if (user.teacher) await user.teacher.destroy({ transaction });
    if (user.student) await user.student.destroy({ transaction });

    if (role === ROLES.TEACHER) {
      await Teacher.create({
        userId: user.id, teacherCode: user.username, fullName, email: user.email,
      }, { transaction });
    } else if (role === ROLES.STUDENT) {
      await Student.create({
        userId: user.id, studentCode: user.username, fullName, email: user.email, classId,
      }, { transaction });
    }

    const oldRole = user.role;
    await user.update({ role }, { transaction });
    await audit.log({
      action: 'USER_ROLE_CHANGED', entityType: 'users', entityId: user.id, oldValue: { role: oldRole }, newValue: { role },
    }, meta, { transaction });
  });
  return findRow(userId);
};

exports.setStatus = async (userId, isActive, meta = {}) => {
  if (isSelf(meta, userId)) throw new AppError('Không thể tự khoá tài khoản của chính mình', 400);
  await sequelize.transaction(async (transaction) => {
    const user = await findUser(userId, { transaction });
    if (!isActive) await ensureAnotherActiveAdmin(user, transaction);
    const old = user.isActive;
    await user.update({ isActive }, { transaction });
    await audit.log({
      action: 'USER_STATUS_CHANGED', entityType: 'users', entityId: user.id, oldValue: { isActive: old }, newValue: { isActive },
    }, meta, { transaction });
  });
  return findRow(userId);
};

// Mặc định đặt lại mật khẩu = username (giống mật khẩu ban đầu khi tạo); bắt đổi ở lần đăng nhập sau.
// Trả về username để controller soạn thông báo.
exports.resetPassword = async (userId, newPassword, meta = {}) => sequelize.transaction(async (transaction) => {
  const user = await findUser(userId, { transaction });
  await user.update({
    passwordHash: await hashPassword(newPassword || user.username), mustChangePassword: true,
  }, { transaction });
  await audit.log({ action: 'USER_PASSWORD_RESET', entityType: 'users', entityId: user.id }, meta, { transaction });
  return user.username;
});
