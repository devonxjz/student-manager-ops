// Ghi audit_logs. Gọi trong transaction của thao tác chính để log và dữ liệu cùng commit/rollback.
const { AuditLog } = require('../models');

const SENSITIVE = ['passwordHash', 'password'];

// Bản ghi Sequelize -> object thuần, bỏ trường nhạy cảm
const snapshot = (value) => {
  if (value == null) return null;
  const plain = typeof value.get === 'function' ? value.get({ plain: true }) : { ...value };
  SENSITIVE.forEach((k) => delete plain[k]);
  return plain;
};

// meta lấy từ request: { actorId, requestId, ip }
exports.metaFromReq = (req) => ({ actorId: req.user ? req.user.id : null, requestId: req.id, ip: req.ip });

exports.log = ({
  action, entityType, entityId = null, oldValue = null, newValue = null,
}, meta = {}, { transaction } = {}) => AuditLog.create({
  action,
  entityType,
  entityId,
  oldValue: snapshot(oldValue),
  newValue: snapshot(newValue),
  actorId: meta.actorId || null,
  requestId: meta.requestId || null,
  ipAddress: meta.ip || null,
}, { transaction });
