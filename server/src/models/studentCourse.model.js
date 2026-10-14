const { SEMESTER_REGEX } = require('../config/constants');
const pk = require('./_id');

// Cột is_passed trong schema.sql là cột sinh tự động (STORED) nên không khai báo ở đây;
// app tự tính passed = score >= PASS_SCORE.
module.exports = (sequelize, DataTypes) => {
  const StudentCourse = sequelize.define('StudentCourse', {
    ...pk(DataTypes),
    semester: { type: DataTypes.STRING(10), allowNull: false, validate: { is: SEMESTER_REGEX } },
    score: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true, // NULL = chưa có điểm
      validate: { min: 0, max: 10 },
      // MySQL trả DECIMAL dạng chuỗi -> đổi về number
      get() {
        const v = this.getDataValue('score');
        return v == null ? null : Number(v);
      },
    },
    gradedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'student_courses',
    underscored: true,
    indexes: [{ unique: true, fields: ['student_id', 'course_id'] }],
  });

  StudentCourse.associate = (m) => {
    StudentCourse.belongsTo(m.Student, { foreignKey: { name: 'studentId', allowNull: false }, as: 'student', onDelete: 'CASCADE' });
    StudentCourse.belongsTo(m.Course, { foreignKey: { name: 'courseId', allowNull: false }, as: 'course', onDelete: 'RESTRICT' });
    StudentCourse.belongsTo(m.User, { foreignKey: { name: 'gradedBy', allowNull: true }, as: 'grader', onDelete: 'SET NULL' });
  };
  return StudentCourse;
};
