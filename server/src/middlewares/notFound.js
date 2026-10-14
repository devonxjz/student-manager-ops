const AppError = require('../utils/AppError');

module.exports = (req, res, next) => next(new AppError(`Không tìm thấy API ${req.method} ${req.originalUrl}`, 404));
