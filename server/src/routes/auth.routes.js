const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { registerRules, loginRules, changePasswordRules } = require('../validators');
const ctrl = require('../controllers/auth.controller');
const ah = require('../utils/asyncHandler');

router.post('/register', registerRules, validate, ah(ctrl.register));
router.post('/login', loginRules, validate, ah(ctrl.login));
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.put('/password', authenticate, changePasswordRules, validate, ah(ctrl.changePassword));

module.exports = router;
