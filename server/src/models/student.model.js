const { GENDERS, STUDENT_STATUSES } = require('../config/constants');
const pk = require('./_id');

module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    ...pk(DataTypes),
    studentCode: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING(100), allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM(...GENDERS) },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(15) },
    avatar: { type: DataTypes.BLOB('medium') }, // ảnh thẻ, MEDIUMBLOB
    avatarMime: { type: DataTypes.STRING(50) },
    status: { type: DataTypes.ENUM(...STUDENT_STATUSES), allowNull: false, defaultValue: 'studying' },
  }, { tableName: 'students', underscored: true });

  Student.associate = (m) => {
    Student.belongsTo(m.User, { foreignKey: { name: 'userId', allowNull: false, unique: true }, as: 'user', onDelete: 'CASCADE' });
    Student.belongsTo(m.Class, { foreignKey: { name: 'classId', allowNull: false }, as: 'class', onDelete: 'RESTRICT' });
    Student.hasMany(m.StudentCourse, { foreignKey: 'studentId', as: 'results', onDelete: 'CASCADE' });
  };
  return Student;
};
