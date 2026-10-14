const { Sequelize, DataTypes } = require('sequelize');
const { env } = require('../config');
const dbConfig = require('../config/database')[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const db = {
  User: require('./user.model')(sequelize, DataTypes),
  Teacher: require('./teacher.model')(sequelize, DataTypes),
  Class: require('./class.model')(sequelize, DataTypes),
  Student: require('./student.model')(sequelize, DataTypes),
  Course: require('./course.model')(sequelize, DataTypes),
  StudentCourse: require('./studentCourse.model')(sequelize, DataTypes),
  AuditLog: require('./auditLog.model')(sequelize, DataTypes),
};

Object.values(db).forEach((model) => model.associate && model.associate(db));

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
