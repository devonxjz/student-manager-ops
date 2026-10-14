const { fn, col } = require('sequelize');
const { Course, StudentCourse } = require('../models');
const createCrudService = require('./crud.service');

// enrolled = số kết quả học tập của môn (cột "Lượt học")
const decorate = async (records) => {
  const rows = await StudentCourse.findAll({
    attributes: ['courseId', [fn('COUNT', col('id')), 'enrolled']],
    where: { courseId: records.map((r) => r.id) },
    group: ['courseId'],
    raw: true,
  });
  const enrolled = new Map(rows.map((r) => [r.courseId, Number(r.enrolled)]));
  return records.map((r) => ({ ...r.get({ plain: true }), enrolled: enrolled.get(r.id) || 0 }));
};

module.exports = createCrudService(Course, {
  name: 'môn học',
  fields: ['courseCode', 'name', 'credits', 'isActive'],
  searchable: ['courseCode', 'name'],
  filterable: ['isActive'],
  audit: 'courses',
  order: [['courseCode', 'ASC']],
  decorate,
});
