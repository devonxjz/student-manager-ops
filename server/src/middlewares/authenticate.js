const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

const readToken = (req) => {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

// Đọc JWT (cookie httpOnly, hoặc header Bearer) -> req.user = hồ sơ mới nhất từ DB.
// Đọc lại DB để khoá tài khoản / đổi role có hiệu lực ngay, không đợi token hết hạn.
module.exports = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return next(new AppError('Chưa đăng nhập', 401));

  let payload;
  try {
    payload = authService.verifyToken(token);
  } catch {
    res.clearCookie('token');
    return next(new AppError('Phiên đăng nhập hết hạn', 401));
  }

  try {
    const user = await authService.getProfile(payload.id);
    if (!user || !user.isActive) {
      res.clearCookie('token');
      return next(new AppError('Tài khoản không còn hiệu lực', 401));
    }
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};
