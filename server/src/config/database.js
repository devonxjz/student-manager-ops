// Dùng chung cho app (models/index.js). Test chạy SQLite in-memory để không cần MySQL.
require('dotenv').config();

const common = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00', // schema.sql lưu UTC
  pool: { max: 5, min: 0, idle: 10000 },
};

module.exports = {
  development: common,
  production: common,
  test: { dialect: 'sqlite', storage: ':memory:', logging: false },
};
