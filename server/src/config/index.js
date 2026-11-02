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
  // Số proxy đứng trước Node (Express lấy IP thật từ X-Forwarded-For theo số này).
  // HTTP:  client -> ALB -> nginx -> Node          => 2
  // HTTPS: client -> API Gateway -> ALB -> nginx -> Node => 3
  // Đặt thấp hơn thực tế thì mọi người dùng bị gộp thành 1 IP (IP của ALB);
  // đặt cao hơn thì client giả được IP bằng header X-Forwarded-For.
  trustProxy: Number(process.env.TRUST_PROXY ?? 2),
  // Giới hạn đăng nhập: chỉ đếm lần đăng nhập SAI, theo IP, trong một cửa sổ thời gian
  loginRateLimit: {
    max: Number(process.env.LOGIN_RATE_MAX || 10),
    windowMs: Number(process.env.LOGIN_RATE_WINDOW_MIN || 15) * 60 * 1000,
  },
};
