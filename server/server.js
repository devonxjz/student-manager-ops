require('dotenv').config();
const app = require('./app');
const { port } = require('./src/config');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');

sequelize.authenticate()
  .then(() => app.listen(port, () => logger.info(`Server chạy cổng ${port}`)))
  .catch((e) => { logger.error('Không kết nối được DB', { error: e.message }); process.exit(1); });
