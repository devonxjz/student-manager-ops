const rateLimit = require('express-rate-limit');
const config = require('../config');
const AppError = require('../utils/AppError');

// Giới hạn đăng nhập sai theo IP. Đăng nhập đúng không bị đếm, nên nhiều sinh viên
// dùng chung một IP (wifi trường) vẫn đăng nhập bình thường.
// Chặn trước bcrypt/DB: request vượt giới hạn bị trả 429 ngay.
const loginLimiter = rateLimit({
  windowMs: config.loginRateLimit.windowMs,
  limit: config.loginRateLimit.max,
  skipSuccessfulRequests: true,
  standardHeaders: true, // RateLimit-* và Retry-After
  legacyHeaders: false,
  handler: (req, res, next) => next(
    new AppError('Đăng nhập sai quá nhiều lần, vui lòng thử lại sau ít phút', 429),
  ),
});

module.exports = { loginLimiter };
