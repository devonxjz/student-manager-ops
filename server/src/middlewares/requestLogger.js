const morgan = require('morgan');
const crypto = require('crypto');
const logger = require('../utils/logger');

morgan.token('id', (req) => req.id);
morgan.token('user', (req) => (req.user ? `${req.user.role}:${req.user.id}` : '-'));

module.exports = [
  (req, res, next) => { req.id = crypto.randomUUID(); next(); },
  morgan(':id :method :url :status :response-time ms user=:user', {
    stream: { write: (msg) => logger.info(msg.trim(), { type: 'http' }) },
    skip: (req) => req.path === '/health' || !req.originalUrl.startsWith('/api'),
  }),
];
