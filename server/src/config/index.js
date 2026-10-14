require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

if (env === 'production' && !process.env.JWT_SECRET) {
  throw new Error('Thiếu biến môi trường JWT_SECRET');
}

module.exports = {
  env,
  port: Number(process.env.PORT || 8080),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-doi-ngay-khi-deploy',
  jwtExpiresIn: '8h',
  cookieMaxAgeMs: 8 * 60 * 60 * 1000,
  // cookie secure chỉ khi chạy HTTPS (EB mặc định là HTTP)
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  bcryptRounds: env === 'test' ? 4 : 10,
  logLevel: process.env.LOG_LEVEL || 'info',
};
