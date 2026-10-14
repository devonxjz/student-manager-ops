const pk = require('./_id');

module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    ...pk(DataTypes),
    teacherCode: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(15) },
    department: { type: DataTypes.STRING(100) },
  }, { tableName: 'teachers', underscored: true });

  Teacher.associate = (m) => {
    Teacher.belongsTo(m.User, { foreignKey: { name: 'userId', allowNull: false, unique: true }, as: 'user', onDelete: 'CASCADE' });
    Teacher.hasMany(m.Class, { foreignKey: 'teacherId', as: 'classes', onDelete: 'SET NULL' });
  };
  return Teacher;
};
