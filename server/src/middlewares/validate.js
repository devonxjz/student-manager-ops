const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(new AppError('Dữ liệu không hợp lệ', 400, details));
};
