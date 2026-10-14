// Tạo admin đầu tiên nếu chưa có (chạy lại nhiều lần không lỗi). Schema tạo bằng database/schema.sql.
require('dotenv').config();
const db = require('../src/models');
const { createAccount } = require('../src/services/auth.service');
const logger = require('../src/utils/logger');

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) throw new Error('Thiếu biến môi trường ADMIN_INITIAL_PASSWORD');

  const existing = await db.User.findOne({ where: { username } });
  if (existing) {
    logger.info(`Admin "${username}" đã tồn tại, bỏ qua`);
  } else {
    await createAccount({ username, password, role: 'admin' });
    logger.info(`Đã tạo admin "${username}"`);
  }
}

main()
  .catch((e) => { logger.error('Seed thất bại', { error: e.message }); process.exitCode = 1; })
  .finally(() => db.sequelize.close());
