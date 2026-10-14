const { createLogger, format, transports } = require('winston');
const { env, logLevel } = require('../config');

const logger = createLogger({
  level: logLevel,
  silent: env === 'test',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'student-manager' },
  transports: [new transports.Console()],
});

module.exports = logger;
