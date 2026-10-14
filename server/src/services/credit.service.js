const { Op } = require('sequelize');
const { StudentCourse, Course, Student } = require('../models');
const { TOTAL_REQUIRED_CREDITS, PASS_SCORE } = require('../config/constants');

// Map studentId -> tín chỉ đã đạt (score >= PASS_SCORE). Bỏ studentIds để lấy tất cả sinh viên.
exports.earnedMap = async (studentIds) => {
  const where = { score: { [Op.gte]: PASS_SCORE } };
  if (studentIds) where.studentId = studentIds;
  const rows = await StudentCourse.findAll({
    attributes: ['studentId'], where, include: [{ model: Course, as: 'course', attributes: ['credits'] }],
  });
  const map = new Map();
  rows.forEach((r) => map.set(r.studentId, (map.get(r.studentId) || 0) + r.course.credits));
  return map;
};

// Map classId -> [{ studentId, earned }]. Bỏ classIds để lấy tất cả lớp.
exports.creditsByClass = async (classIds) => {
  const students = await Student.findAll({
    attributes: ['id', 'classId'], where: classIds ? { classId: classIds } : {}, raw: true,
  });
  const earned = await exports.earnedMap(students.map((s) => s.id));
  const byClass = new Map();
  students.forEach((s) => {
    if (!byClass.has(s.classId)) byClass.set(s.classId, []);
    byClass.get(s.classId).push({ studentId: s.id, earned: earned.get(s.id) || 0 });
  });
  return byClass;
};

exports.getSummary = async (studentId) => {
  const rows = await StudentCourse.findAll({
    where: { studentId, score: { [Op.ne]: null } },
    include: [{ model: Course, as: 'course' }],
    order: [[{ model: Course, as: 'course' }, 'courseCode', 'ASC']],
  });
  const toItem = (r) => ({
    courseId: r.course.id, code: r.course.courseCode, name: r.course.name, credits: r.course.credits, score: r.score,
  });
  const passed = rows.filter((r) => r.score >= PASS_SCORE).map(toItem);
  const earned = passed.reduce((sum, c) => sum + c.credits, 0);
  return {
    earned,
    total: TOTAL_REQUIRED_CREDITS,
    percent: Math.min(100, Math.round((earned / TOTAL_REQUIRED_CREDITS) * 100)),
    courses: passed,
    failedCourses: rows.filter((r) => r.score < PASS_SCORE).map(toItem),
  };
};
