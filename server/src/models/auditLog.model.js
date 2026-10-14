const pk = require('./_id');

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    ...pk(DataTypes, DataTypes.BIGINT.UNSIGNED),
    action: { type: DataTypes.STRING(50), allowNull: false }, // VD USER_ROLE_CHANGED
    entityType: { type: DataTypes.STRING(30), allowNull: false }, // VD students
    entityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    oldValue: { type: DataTypes.JSON, allowNull: true },
    newValue: { type: DataTypes.JSON, allowNull: true },
    requestId: { type: DataTypes.CHAR(36), allowNull: true }, // trùng requestId trong log CloudWatch
    ipAddress: { type: DataTypes.STRING(45), allowNull: true },
  }, { tableName: 'audit_logs', underscored: true, updatedAt: false });

  AuditLog.associate = (m) => {
    AuditLog.belongsTo(m.User, { foreignKey: { name: 'actorId', allowNull: true }, as: 'actor', onDelete: 'SET NULL' });
  };
  return AuditLog;
};
