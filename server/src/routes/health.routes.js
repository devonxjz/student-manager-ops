const router = require('express').Router();

// EB health check: không cần đăng nhập, không truy vấn DB
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
