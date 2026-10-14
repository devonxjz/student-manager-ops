const AppError = require('../utils/AppError');

module.exports = (...roles) => (req, res, next) =>
  (req.user && roles.includes(req.user.role) ? next() : next(new AppError('Bạn không có quyền truy cập', 403)));
