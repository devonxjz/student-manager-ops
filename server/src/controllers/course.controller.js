const createCrudController = require('./crud.controller');
const courseService = require('../services/course.service');

module.exports = createCrudController(courseService);
