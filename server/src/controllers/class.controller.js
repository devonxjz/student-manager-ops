const createCrudController = require('./crud.controller');
const classService = require('../services/class.service');
const { ROLES } = require('../config/constants');

// Admin: mọi lớp
exports.forAdmin = createCrudController(classService);

// Giáo viên: chỉ lớp mình chủ nhiệm (admin gọi API giáo viên thì vẫn thấy mọi lớp).
// -1 = giáo viên chưa có hồ sơ -> không khớp lớp nào
const teacherScope = (req) => (req.user.role === ROLES.ADMIN ? {} : { teacherId: req.user.profile.teacherId ?? -1 });

exports.forTeacher = {
  ...createCrudController(classService, { scope: teacherScope }),
  // GET /teacher/classes/:classId (đã qua classOwnership)
  one: async (req, res) => res.json(await classService.get(req.params.classId)),
};
