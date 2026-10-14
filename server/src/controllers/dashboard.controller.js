const dashboardService = require('../services/dashboard.service');
const { ROLES } = require('../config/constants');

exports.adminStats = async (req, res) => res.json(await dashboardService.getAdminStats());

// Giáo viên chỉ thấy số liệu lớp mình; admin gọi thì thấy mọi lớp
exports.teacherStats = async (req, res) => {
  const scope = req.user.role === ROLES.ADMIN ? {} : { teacherId: req.user.profile.teacherId ?? -1 };
  res.json(await dashboardService.getTeacherStats(scope));
};
