process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-chi-dung-cho-test';
// Các test đăng nhập sai nhiều lần từ cùng IP: nới giới hạn, riêng rateLimit.test.js đặt lại
process.env.LOGIN_RATE_MAX = process.env.LOGIN_RATE_MAX || '1000';
