// Một service sinh viên duy nhất. Admin gọi không scope (mọi lớp, được chuyển lớp);
// giáo viên gọi với scope { classId } (xem student.controller.js).
const { Student, Class, User } = require('../models');
const { ROLES } = require('../config/constants');
const createCrudService = require('./crud.service');
const creditService = require('./credit.service');
const accountHooks = require('./account.hooks');

// FE cần earnedCredits (thanh tiến độ) và isActive (trạng thái tài khoản) phẳng trên mỗi dòng
const decorate = async (records) => {
  const earned = await creditService.earnedMap(records.map((r) => r.id));
  return records.map((r) => {
    const { user, ...rest } = r.get({ plain: true });
    return { ...rest, earnedCredits: earned.get(r.id) || 0, isActive: user ? Boolean(user.isActive) : true };
  });
};

module.exports = createCrudService(Student, {
  name: 'sinh viên',
  fields: ['studentCode', 'fullName', 'dateOfBirth', 'gender', 'email', 'phone', 'status', 'classId'],
  searchable: ['studentCode', 'fullName', 'email'],
  filterable: ['classId', 'status'],
  audit: 'students',
  order: [['studentCode', 'ASC']],
  include: [
    { model: Class, as: 'class', attributes: ['id', 'classCode', 'name'] },
    { model: User, as: 'user', attributes: ['id', 'isActive'] },
  ],
  hooks: accountHooks({ role: ROLES.STUDENT, codeField: 'studentCode' }),
  decorate,
});
