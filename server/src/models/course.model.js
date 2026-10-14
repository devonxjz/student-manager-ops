const { CREDITS_MIN, CREDITS_MAX } = require('../config/constants');
const pk = require('./_id');

module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    ...pk(DataTypes),
    courseCode: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    credits: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: CREDITS_MIN, max: CREDITS_MAX } },
    // false = ngừng mở, giữ lại để không mất lịch sử điểm
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'courses', underscored: true });

  Course.associate = (m) => {
    // Không cho xoá môn đã có điểm (tránh mất tín chỉ của SV)
    Course.hasMany(m.StudentCourse, { foreignKey: 'courseId', as: 'results', onDelete: 'RESTRICT' });
  };
  return Course;
};
