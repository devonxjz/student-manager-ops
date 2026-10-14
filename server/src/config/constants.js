module.exports = {
  ROLES: Object.freeze({ STUDENT: 'student', TEACHER: 'teacher', ADMIN: 'admin' }),
  ROLE_LIST: ['student', 'teacher', 'admin'],
  GENDERS: ['male', 'female', 'other'],
  STUDENT_STATUSES: ['studying', 'suspended', 'graduated', 'dropped'],
  TOTAL_REQUIRED_CREDITS: 150,
  PASS_SCORE: 5,
  CREDITS_MIN: 1,
  CREDITS_MAX: 10,
  INTAKE_YEAR_MIN: 2000,
  INTAKE_YEAR_MAX: 2100,
  SEMESTER_REGEX: /^[0-9]{4}-[1-3]$/, // VD 2026-1
};
