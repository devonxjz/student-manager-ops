const { Class } = require('../models');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');

// Giáo viên chỉ thao tác lớp mình chủ nhiệm. Admin được mọi lớp (nhưng lớp vẫn phải tồn tại).
module.exports = async (req, res, next) => {
  const cls = await Class.findByPk(req.params.classId);
  if (!cls) return next(new AppError('Không tìm thấy lớp', 404));
  if (req.user.role !== ROLES.ADMIN && cls.teacherId !== req.user.profile.teacherId) {
    return next(new AppError('Lớp này không do bạn quản lý', 403));
  }
  req.class = cls;
  return next();
};
