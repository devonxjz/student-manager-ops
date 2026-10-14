const { Class, Teacher } = require('../models');
const createCrudService = require('./crud.service');
const creditService = require('./credit.service');
const stats = require('./creditStats');

// Thêm số liệu cho từng lớp: sĩ số, TB tín chỉ, số SV chậm tiến độ (dưới 40%)
const decorate = async (records) => {
  const byClass = await creditService.creditsByClass(records.map((r) => r.id));
  return records.map((r) => {
    const credits = (byClass.get(r.id) || []).map((s) => s.earned);
    return {
      ...r.get({ plain: true }),
      studentCount: credits.length,
      avgCredits: stats.average(credits),
      atRisk: credits.filter(stats.isAtRisk).length,
    };
  });
};

module.exports = createCrudService(Class, {
  name: 'lớp',
  fields: ['classCode', 'name', 'intakeYear', 'teacherId'],
  searchable: ['classCode', 'name'],
  filterable: ['teacherId', 'intakeYear'],
  audit: 'classes',
  order: [['classCode', 'ASC']],
  include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'teacherCode', 'fullName', 'email'] }],
  decorate,
});
