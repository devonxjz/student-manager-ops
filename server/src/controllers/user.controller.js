const userService = require('../services/user.service');
const { metaFromReq } = require('../services/audit.service');

exports.list = async (req, res) => res.json(await userService.list(req.query));

exports.changeRole = async (req, res) => {
  const { role, classId } = req.body;
  res.json(await userService.changeRole(req.params.id, { role, classId }, metaFromReq(req)));
};

exports.setStatus = async (req, res) => {
  res.json(await userService.setStatus(req.params.id, req.body.isActive, metaFromReq(req)));
};

exports.resetPassword = async (req, res) => {
  const newPassword = req.body && req.body.newPassword;
  const username = await userService.resetPassword(req.params.id, newPassword, metaFromReq(req));
  res.json({ message: newPassword ? 'Đã đặt lại mật khẩu' : `Đã đặt lại mật khẩu về mặc định (${username})` });
};
