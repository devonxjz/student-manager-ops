const { ROLE_LIST } = require('../config/constants');
const pk = require('./_id');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    ...pk(DataTypes),
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.CHAR(60), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    role: { type: DataTypes.ENUM(...ROLE_LIST), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    // true = đang dùng mật khẩu mặc định/được reset -> React nhắc đổi
    mustChangePassword: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
  }, { tableName: 'users', underscored: true });

  // Không bao giờ trả passwordHash ra JSON
  User.prototype.toJSON = function toJSON() {
    const { passwordHash, ...rest } = this.get();
    return rest;
  };

  User.associate = (m) => {
    User.hasOne(m.Teacher, { foreignKey: 'userId', as: 'teacher', onDelete: 'CASCADE' });
    User.hasOne(m.Student, { foreignKey: 'userId', as: 'student', onDelete: 'CASCADE' });
  };
  return User;
};
