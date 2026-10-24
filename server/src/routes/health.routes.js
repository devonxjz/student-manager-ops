const router = require('express').Router();

// EB health check: không cần đăng nhập, không truy vấn DB
router.get('/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

module.exports = router;
