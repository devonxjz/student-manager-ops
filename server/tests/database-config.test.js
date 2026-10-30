describe('Database config SSL', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('Khi DB_SSL=true, dialectOptions.ssl là Amazon RDS', () => {
    process.env.DB_SSL = 'true';
    const dbConfig = require('../src/config/database');
    expect(dbConfig.production.dialectOptions).toBeDefined();
    expect(dbConfig.production.dialectOptions.ssl).toBe('Amazon RDS');
    expect(dbConfig.development.dialectOptions).toBeDefined();
    expect(dbConfig.development.dialectOptions.ssl).toBe('Amazon RDS');
  });

  test('Khi DB_SSL không được bật, không có dialectOptions', () => {
    delete process.env.DB_SSL;
    const dbConfig = require('../src/config/database');
    expect(dbConfig.production.dialectOptions).toBeUndefined();
    expect(dbConfig.development.dialectOptions).toBeUndefined();
  });
});
