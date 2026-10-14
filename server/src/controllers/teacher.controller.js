const createCrudController = require('./crud.controller');
const teacherService = require('../services/teacher.service');

module.exports = createCrudController(teacherService);
