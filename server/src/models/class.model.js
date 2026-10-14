const { INTAKE_YEAR_MIN, INTAKE_YEAR_MAX } = require('../config/constants');
const pk = require('./_id');

module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
    ...pk(DataTypes),
    classCode: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    intakeYear: {
      type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, validate: { min: INTAKE_YEAR_MIN, max: INTAKE_YEAR_MAX },
    },
  }, { tableName: 'classes', underscored: true });

  Class.associate = (m) => {
    Class.belongsTo(m.Teacher, { foreignKey: { name: 'teacherId', allowNull: true }, as: 'teacher', onDelete: 'SET NULL' });
    // Không cho xoá lớp khi còn sinh viên
    Class.hasMany(m.Student, { foreignKey: 'classId', as: 'students', onDelete: 'RESTRICT' });
  };
  return Class;
};
