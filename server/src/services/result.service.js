// Nhập điểm môn học cho một sinh viên (để tính tín chỉ)
const { sequelize, Course, StudentCourse } = require('../models');
const { PASS_SCORE, TOTAL_REQUIRED_CREDITS } = require('../config/constants');
const creditService = require('./credit.service');
const audit = require('./audit.service');
const { currentSemester } = require('../utils/semester');
const AppError = require('../utils/AppError');

const toDto = (row) => ({ courseId: row.courseId, semester: row.semester, score: row.score });
const isBlank = (score) => score === undefined || score === null || score === '';

// student: bản ghi sinh viên đã qua student.service.get (có class). Trả đúng dạng FE trang "Nhập điểm" đọc.
exports.getResults = async (student) => {
  const [courses, rows] = await Promise.all([
    Course.findAll({ order: [['courseCode', 'ASC']] }),
    StudentCourse.findAll({ where: { studentId: student.id } }),
  ]);
  const rowOf = new Map(rows.map((r) => [r.courseId, r]));
  const credits = await creditService.getSummary(student.id);
  return {
    student: { ...student, earnedCredits: credits.earned },
    total: TOTAL_REQUIRED_CREDITS,
    passScore: PASS_SCORE,
    courses: courses.map((c) => {
      const row = rowOf.get(c.id);
      const score = row ? row.score : null;
      return {
        courseId: c.id,
        courseCode: c.courseCode,
        name: c.name,
        credits: c.credits,
        isActive: c.isActive,
        semester: row ? row.semester : null,
        score,
        passed: score !== null && score >= PASS_SCORE,
        gradedAt: row ? row.gradedAt : null,
      };
    }),
    credits,
  };
};

/**
 * results: [{ courseId, score, semester? }]
 *   - score có giá trị: thêm/sửa. semester bỏ trống thì giữ học kỳ cũ, môn mới lấy học kỳ hiện tại.
 *   - score null / '' : xoá kết quả môn đó (không có thì bỏ qua)
 * meta: { actorId, requestId, ip } -> graded_by + audit_logs
 */
exports.saveResults = async (student, results, meta = {}) => {
  const courseIds = [...new Set(results.map((r) => Number(r.courseId)))];
  if ((await Course.count({ where: { id: courseIds } })) !== courseIds.length) {
    throw new AppError('Có môn học không tồn tại', 400);
  }

  await sequelize.transaction(async (transaction) => {
    const existing = await StudentCourse.findAll({ where: { studentId: student.id, courseId: courseIds }, transaction });
    const rowOf = new Map(existing.map((r) => [r.courseId, r]));

    for (const item of results) {
      const courseId = Number(item.courseId);
      const row = rowOf.get(courseId);
      if (isBlank(item.score)) {
        if (row) {
          await row.destroy({ transaction });
          rowOf.delete(courseId);
        }
      } else {
        const data = {
          score: Number(item.score),
          semester: item.semester || (row && row.semester) || currentSemester(),
          gradedBy: meta.actorId || null,
          gradedAt: new Date(),
        };
        if (row) await row.update(data, { transaction });
        else rowOf.set(courseId, await StudentCourse.create({ studentId: student.id, courseId, ...data }, { transaction }));
      }
    }

    await audit.log({
      action: 'RESULTS_UPDATED',
      entityType: 'students',
      entityId: student.id,
      oldValue: { results: existing.map(toDto) },
      newValue: { results },
    }, meta, { transaction });
  });
  return exports.getResults(student);
};
