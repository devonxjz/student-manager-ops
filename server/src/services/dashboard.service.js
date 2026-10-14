// Số liệu cho dashboard admin và giáo viên. Dạng dữ liệu bám theo các trang React (xem client/src/mocks/server.js).
const { Op, fn, col } = require('sequelize');
const {
  Student, Teacher, Course, User, StudentCourse, Class,
} = require('../models');
const { ROLE_LIST, PASS_SCORE } = require('../config/constants');
const classService = require('./class.service');
const creditService = require('./credit.service');
const stats = require('./creditStats');

const AT_RISK_LIST_SIZE = 6;
const COURSE_PASS_RATE_MIN_ATTEMPTS = 5;
const COURSE_PASS_RATE_LIMIT = 8;

const countUsers = (where) => User.count({ where });

const roleCounts = async () => {
  const rows = await User.findAll({ attributes: ['role', [fn('COUNT', col('id')), 'count']], group: ['role'], raw: true });
  const countOf = new Map(rows.map((r) => [r.role, Number(r.count)]));
  return ROLE_LIST.map((role) => ({ role, count: countOf.get(role) || 0 }));
};

// Môn có nhiều lượt học nhất mà tỉ lệ đạt thấp nhất -> admin cần chú ý
const coursePassRate = async () => {
  const [courses, rows] = await Promise.all([
    Course.findAll({ attributes: ['id', 'courseCode', 'name'], raw: true }),
    StudentCourse.findAll({ attributes: ['courseId', 'score'], where: { score: { [Op.ne]: null } } }),
  ]);
  return courses
    .map((c) => {
      const scores = rows.filter((r) => r.courseId === c.id).map((r) => r.score);
      const passed = scores.filter((s) => s >= PASS_SCORE).length;
      return {
        courseCode: c.courseCode, name: c.name, attempts: scores.length, passRate: scores.length ? Math.round((passed / scores.length) * 100) : null,
      };
    })
    .filter((c) => c.attempts >= COURSE_PASS_RATE_MIN_ATTEMPTS)
    .sort((a, b) => a.passRate - b.passRate)
    .slice(0, COURSE_PASS_RATE_LIMIT);
};

exports.getAdminStats = async () => {
  const [classes, byClass, teachers, courses, roles, active, locked, mustChangePassword, passRates, withoutTeacher] = await Promise.all([
    classService.list(),
    creditService.creditsByClass(),
    Teacher.count(),
    Course.count(),
    roleCounts(),
    countUsers({ isActive: true }),
    countUsers({ isActive: false }),
    countUsers({ mustChangePassword: true }),
    coursePassRate(),
    classService.list({ filters: { teacherId: null } }),
  ]);
  const credits = [...byClass.values()].flat().map((s) => s.earned);

  return {
    counts: {
      classes: classes.length, teachers, students: credits.length, courses,
    },
    avgCredits: stats.average(credits),
    bands: stats.bands(credits),
    creditDistribution: stats.distribution(credits),
    studentsPerClass: classes.map((c) => ({ classCode: c.classCode, count: c.studentCount, avgCredits: c.avgCredits })),
    roles,
    accounts: { active, locked, mustChangePassword },
    coursePassRate: passRates,
    classesWithoutTeacher: withoutTeacher,
  };
};

// scope: điều kiện lớp ({} = mọi lớp cho admin, { teacherId } cho giáo viên)
exports.getTeacherStats = async (scope) => {
  const classes = await classService.list({ scope });
  const byClass = await creditService.creditsByClass(classes.map((c) => c.id));
  const students = classes.flatMap((c) => byClass.get(c.id) || []);
  const credits = students.map((s) => s.earned);

  // Sinh viên chậm tiến độ: ít tín chỉ nhất trước, giới hạn số dòng hiển thị
  const atRiskIds = students.filter((s) => stats.isAtRisk(s.earned))
    .sort((a, b) => a.earned - b.earned || a.studentId - b.studentId)
    .slice(0, AT_RISK_LIST_SIZE);
  const profiles = await Student.findAll({
    where: { id: atRiskIds.map((s) => s.studentId) },
    attributes: ['id', 'studentCode', 'fullName', 'classId'],
    include: [{ model: Class, as: 'class', attributes: ['id', 'classCode', 'name'] }],
  });
  const profileOf = new Map(profiles.map((p) => [p.id, p.get({ plain: true })]));

  return {
    classCount: classes.length,
    studentCount: students.length,
    avgCredits: stats.average(credits),
    bands: stats.bands(credits),
    distribution: stats.distribution(credits),
    byClass: classes.map((c) => ({
      classId: c.id, classCode: c.classCode, avgCredits: c.avgCredits, studentCount: c.studentCount,
    })),
    atRiskStudents: atRiskIds.map((s) => ({ ...profileOf.get(s.studentId), earnedCredits: s.earned })),
  };
};
