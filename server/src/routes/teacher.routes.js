const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const classOwnership = require('../middlewares/classOwnership');
const validate = require('../middlewares/validate');
const mountCrud = require('./crud.routes');
const { studentRules, resultRules } = require('../validators');
const { ROLES } = require('../config/constants');
const classCtrl = require('../controllers/class.controller');
const dashboardCtrl = require('../controllers/dashboard.controller');
const studentCtrl = require('../controllers/student.controller');
const ah = require('../utils/asyncHandler');

const owned = ah(classOwnership);

router.use(authenticate, authorize(ROLES.TEACHER, ROLES.ADMIN));

router.get('/classes', ah(classCtrl.forTeacher.list));
router.get('/stats', ah(dashboardCtrl.teacherStats));
router.get('/classes/:classId', owned, ah(classCtrl.forTeacher.one));

// CRUD sinh viên trong lớp: dùng lại mountCrud, thêm guard classOwnership
mountCrud(router, '/classes/:classId/students', studentCtrl.forClass, { guards: [owned], rules: studentRules });

router.get('/classes/:classId/students/:id/results', owned, ah(studentCtrl.getResults));
router.put('/classes/:classId/students/:id/results', owned, resultRules, validate, ah(studentCtrl.saveResults));

module.exports = router;
