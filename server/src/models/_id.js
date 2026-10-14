// Khoá chính INT UNSIGNED giống database/schema.sql
module.exports = (DataTypes, type = DataTypes.INTEGER.UNSIGNED) => ({
  id: { type, primaryKey: true, autoIncrement: true },
});
