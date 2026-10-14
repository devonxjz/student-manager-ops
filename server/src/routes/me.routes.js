const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { ROLES } = require('../config/constants');
const ctrl = require('../controllers/me.controller');
const ah = require('../utils/asyncHandler');

router.use(authenticate, authorize(ROLES.STUDENT));
router.get('/credits', ah(ctrl.credits));

module.exports = router;
