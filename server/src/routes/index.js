const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/me', require('./me.routes'));
router.use('/teacher', require('./teacher.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
