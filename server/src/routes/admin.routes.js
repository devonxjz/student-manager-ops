const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const mountCrud = require('./crud.routes');
const v = require('../validators');
const { ROLES } = require('../config/constants');
const courseCtrl = require('../controllers/course.controller');
const teacherCtrl = require('../controllers/teacher.controller');
const classCtrl = require('../controllers/class.controller');
const studentCtrl = require('../controllers/student.controller');
const userCtrl = require('../controllers/user.controller');
const dashboardCtrl = require('../controllers/dashboard.controller');
const ah = require('../utils/asyncHandler');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/stats', ah(dashboardCtrl.adminStats));

mountCrud(router, '/courses', courseCtrl, { rules: v.courseRules });
mountCrud(router, '/teachers', teacherCtrl, { rules: v.teacherRules });
mountCrud(router, '/classes', classCtrl.forAdmin, { rules: v.classRules });
mountCrud(router, '/students', studentCtrl.forAdmin, { rules: v.adminStudentRules });

router.get('/users', ah(userCtrl.list));
router.patch('/users/:id/role', v.roleRules, validate, ah(userCtrl.changeRole));
router.patch('/users/:id/status', v.statusRules, validate, ah(userCtrl.setStatus));
router.post('/users/:id/reset-password', v.resetPasswordRules, validate, ah(userCtrl.resetPassword));

module.exports = router;
