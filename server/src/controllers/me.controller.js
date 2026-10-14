const creditService = require('../services/credit.service');
const AppError = require('../utils/AppError');

// Sinh viên: studentId luôn lấy từ token, không bao giờ từ URL
exports.credits = async (req, res) => {
  const { studentId } = req.user.profile;
  if (!studentId) throw new AppError('Không tìm thấy hồ sơ sinh viên', 404);
  res.json(await creditService.getSummary(studentId));
};
