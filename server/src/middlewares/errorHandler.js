const {
  UniqueConstraintError, ValidationError, ForeignKeyConstraintError,
} = require('sequelize');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// Đổi lỗi thư viện (Sequelize, body-parser) sang AppError có status phù hợp
const normalize = (err) => {
  if (err instanceof AppError) return err;
  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {}).join(', ');
    return new AppError(`Dữ liệu đã tồn tại${fields ? ` (${fields})` : ''}`, 409);
  }
  if (err instanceof ForeignKeyConstraintError) {
    return new AppError('Dữ liệu đang được tham chiếu hoặc tham chiếu không tồn tại', 409);
  }
  if (err instanceof ValidationError) {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return new AppError('Dữ liệu không hợp lệ', 400, details);
  }
  if (err.type === 'entity.parse.failed') return new AppError('JSON không hợp lệ', 400);
  return err;
};

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const e = normalize(err);
  const status = e.statusCode || 500;
  logger[status >= 500 ? 'error' : 'warn'](e.message, {
    requestId: req.id, status, stack: status >= 500 ? err.stack : undefined,
  });
  res.status(status).json({ error: status >= 500 ? 'Lỗi hệ thống' : e.message, details: e.details });
};
