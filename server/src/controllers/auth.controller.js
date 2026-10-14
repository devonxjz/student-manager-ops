const authService = require('../services/auth.service');
const { cookieMaxAgeMs, cookieSecure } = require('../config');

const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: cookieSecure, path: '/' };

const setTokenCookie = (res, token) => res.cookie('token', token, { ...cookieOptions, maxAge: cookieMaxAgeMs });

exports.register = async (req, res) => {
  const { user, token } = await authService.register(req.body);
  setTokenCookie(res, token);
  res.status(201).json({ user });
};

exports.login = async (req, res) => {
  const { user, token } = await authService.login(req.body.username, req.body.password);
  setTokenCookie(res, token);
  res.json({ user });
};

exports.logout = (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.status(204).end();
};

exports.me = (req, res) => res.json({ user: req.user });

exports.changePassword = async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.status(204).end();
};
