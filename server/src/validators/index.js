const { body } = require('express-validator');
const C = require('../config/constants');

const required = (field, label, max) => body(field).trim().notEmpty().withMessage(`${label} là bắt buộc`)
  .isLength({ max }).withMessage(`${label} tối đa ${max} ký tự`);
const optionalText = (field, label, max) => body(field).optional({ values: 'null' }).trim()
  .isLength({ max }).withMessage(`${label} tối đa ${max} ký tự`);
const optionalEmail = () => body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Email không hợp lệ');
const optionalDate = (field) => body(field).optional({ values: 'falsy' }).isISO8601().withMessage('Ngày không hợp lệ');
const password = (field, { optional = false } = {}) => {
  const chain = body(field);
  return (optional ? chain.optional({ values: 'falsy' }) : chain)
    .isString().isLength({ min: 6, max: 100 }).withMessage('Mật khẩu từ 6 đến 100 ký tự');
};
const id = (field, { optional = false } = {}) => {
  const chain = body(field);
  return (optional ? chain.optional({ values: 'null' }) : chain)
    .isInt({ min: 1 }).withMessage(`${field} không hợp lệ`).toInt();
};
const oneOf = (field, list) => body(field).optional({ values: 'null' }).isIn(list)
  .withMessage(`${field} phải là một trong: ${list.join(', ')}`);

exports.registerRules = [
  required('studentCode', 'MSSV', 20),
  required('fullName', 'Họ tên', 100),
  required('classCode', 'Mã lớp', 20),
  optionalEmail(),
  optionalDate('dateOfBirth'),
  password('password'),
];

exports.loginRules = [
  body('username').trim().notEmpty().withMessage('Tên đăng nhập là bắt buộc'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
];

exports.changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
  password('newPassword'),
];

exports.courseRules = [
  required('courseCode', 'Mã môn', 20),
  required('name', 'Tên môn', 150),
  body('credits').isInt({ min: C.CREDITS_MIN, max: C.CREDITS_MAX })
    .withMessage(`Số tín chỉ từ ${C.CREDITS_MIN} đến ${C.CREDITS_MAX}`).toInt(),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive phải là true/false').toBoolean(),
];

exports.teacherRules = [
  required('teacherCode', 'Mã giáo viên', 20),
  required('fullName', 'Họ tên', 100),
  optionalEmail(),
  optionalText('phone', 'Số điện thoại', 15),
  optionalText('department', 'Bộ môn', 100),
  password('password', { optional: true }),
];

exports.classRules = [
  required('classCode', 'Mã lớp', 20),
  required('name', 'Tên lớp', 100),
  body('intakeYear').isInt({ min: C.INTAKE_YEAR_MIN, max: C.INTAKE_YEAR_MAX })
    .withMessage(`Khoá từ ${C.INTAKE_YEAR_MIN} đến ${C.INTAKE_YEAR_MAX}`).toInt(),
  id('teacherId', { optional: true }),
];

// Giáo viên: lớp lấy từ URL nên không cần classId trong body
exports.studentRules = [
  required('studentCode', 'MSSV', 20),
  required('fullName', 'Họ tên', 100),
  optionalDate('dateOfBirth'),
  oneOf('gender', C.GENDERS),
  optionalEmail(),
  optionalText('phone', 'Số điện thoại', 15),
  oneOf('status', C.STUDENT_STATUSES),
  password('password', { optional: true }),
];

// Admin: phải chỉ định lớp (students.class_id NOT NULL), đổi classId = chuyển lớp
exports.adminStudentRules = [...exports.studentRules, id('classId')];

exports.resultRules = [
  body('results').isArray({ min: 1 }).withMessage('results phải là mảng khác rỗng'),
  body('results.*.courseId').isInt({ min: 1 }).withMessage('courseId không hợp lệ'),
  // semester và score đều tuỳ chọn; score null hoặc '' nghĩa là xoá điểm môn đó
  body('results.*').custom((item) => {
    if (item.semester !== undefined && item.semester !== null && !C.SEMESTER_REGEX.test(String(item.semester))) {
      throw new Error('semester phải dạng YYYY-1, YYYY-2 hoặc YYYY-3');
    }
    if (item.score !== null && item.score !== undefined && item.score !== '') {
      const n = Number(item.score);
      if (typeof item.score === 'boolean' || !Number.isFinite(n) || n < 0 || n > 10) throw new Error('Điểm từ 0 đến 10');
    }
    return true;
  }),
];

exports.roleRules = [
  body('role').isIn(C.ROLE_LIST).withMessage(`role phải là một trong: ${C.ROLE_LIST.join(', ')}`),
  body('classId').if(body('role').equals(C.ROLES.STUDENT))
    .isInt({ min: 1 }).withMessage('Cần chọn lớp khi chuyển thành sinh viên').toInt(),
];
exports.statusRules = [body('isActive').isBoolean({ strict: true }).withMessage('isActive phải là true/false').toBoolean()];
exports.resetPasswordRules = [password('newPassword', { optional: true })];
