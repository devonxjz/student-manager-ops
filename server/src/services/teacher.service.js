const { Teacher, User, Class } = require('../models');
const { ROLES } = require('../config/constants');
const createCrudService = require('./crud.service');
const accountHooks = require('./account.hooks');

// Làm phẳng tài khoản (username, isActive) và liệt kê lớp đang chủ nhiệm
const decorate = async (records) => {
  const classes = await Class.findAll({
    attributes: ['id', 'classCode', 'teacherId'], where: { teacherId: records.map((r) => r.id) }, order: [['classCode', 'ASC']], raw: true,
  });
  return records.map((r) => {
    const { user, ...rest } = r.get({ plain: true });
    return {
      ...rest,
      username: user ? user.username : null,
      isActive: user ? Boolean(user.isActive) : true,
      classes: classes.filter((c) => c.teacherId === r.id).map(({ id, classCode }) => ({ id, classCode })),
    };
  });
};

module.exports = createCrudService(Teacher, {
  name: 'giáo viên',
  fields: ['teacherCode', 'fullName', 'email', 'phone', 'department'],
  searchable: ['teacherCode', 'fullName', 'email', 'department'],
  audit: 'teachers',
  order: [['teacherCode', 'ASC']],
  include: [{ model: User, as: 'user', attributes: ['id', 'username', 'isActive'] }],
  hooks: accountHooks({ role: ROLES.TEACHER, codeField: 'teacherCode' }),
  decorate,
});
