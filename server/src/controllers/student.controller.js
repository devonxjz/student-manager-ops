const createCrudController = require('./crud.controller');
const studentService = require('../services/student.service');
const resultService = require('../services/result.service');
const { metaFromReq } = require('../services/audit.service');

// Admin: mọi sinh viên, được chuyển lớp
exports.forAdmin = createCrudController(studentService);

// Giáo viên/admin qua /teacher/classes/:classId/students: khoá trong lớp ở URL
// (classOwnership đã kiểm tra lớp thuộc giáo viên này)
const classScope = (req) => ({ classId: Number(req.params.classId) });
exports.forClass = createCrudController(studentService, { scope: classScope });

exports.getResults = async (req, res) => {
  const student = await studentService.get(req.params.id, classScope(req));
  res.json(await resultService.getResults(student));
};

exports.saveResults = async (req, res) => {
  const student = await studentService.get(req.params.id, classScope(req));
  res.json(await resultService.saveResults(student, req.body.results, metaFromReq(req)));
};
