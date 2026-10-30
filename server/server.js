require('dotenv').config();
const { loadSecrets } = require('./src/config/secrets');

async function start() {
  // Tải bí mật từ AWS SSM Parameter Store trước khi nạp cấu hình và kết nối DB
  await loadSecrets();

  const app = require('./app');
  const { port } = require('./src/config');
  const { sequelize } = require('./src/models');
  const logger = require('./src/utils/logger');

  try {
    await sequelize.authenticate();
    app.listen(port, () => logger.info(`Server chạy cổng ${port}`));
  } catch (e) {
    logger.error('Không kết nối được DB', { error: e.message });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start };
