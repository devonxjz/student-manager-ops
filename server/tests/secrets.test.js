const { loadSecrets } = require('../src/config/secrets');

describe('Secrets loader (SSM Parameter Store)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.DB_PASSWORD_PARAM;
    delete process.env.JWT_SECRET_PARAM;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('Bỏ qua khi không có DB_PASSWORD_PARAM và JWT_SECRET_PARAM', async () => {
    const mockSend = jest.fn();
    const mockClient = { send: mockSend };
    const mockLogger = { error: jest.fn(), info: jest.fn() };

    await loadSecrets({ ssmClient: mockClient, logger: mockLogger });

    expect(mockSend).not.toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  test('Đọc thành công DB_PASSWORD từ Parameter Store', async () => {
    process.env.DB_PASSWORD_PARAM = '/sms/dev/db-password';
    process.env.DB_PASSWORD = 'old-password';

    const mockSend = jest.fn().mockResolvedValue({
      Parameter: { Value: 'new-secure-rds-password' },
    });
    const mockClient = { send: mockSend };
    const mockLogger = { error: jest.fn(), info: jest.fn() };

    await loadSecrets({ ssmClient: mockClient, logger: mockLogger });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].input).toEqual({
      Name: '/sms/dev/db-password',
      WithDecryption: true,
    });
    expect(process.env.DB_PASSWORD).toBe('new-secure-rds-password');
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('/sms/dev/db-password')
    );
  });

  test('Đọc thành công JWT_SECRET từ Parameter Store', async () => {
    process.env.JWT_SECRET_PARAM = '/sms/dev/jwt-secret';
    process.env.JWT_SECRET = 'old-secret';

    const mockSend = jest.fn().mockResolvedValue({
      Parameter: { Value: 'new-secure-jwt-secret-key' },
    });
    const mockClient = { send: mockSend };
    const mockLogger = { error: jest.fn(), info: jest.fn() };

    await loadSecrets({ ssmClient: mockClient, logger: mockLogger });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].input).toEqual({
      Name: '/sms/dev/jwt-secret',
      WithDecryption: true,
    });
    expect(process.env.JWT_SECRET).toBe('new-secure-jwt-secret-key');
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('/sms/dev/jwt-secret')
    );
  });

  test('Ghi log lỗi và giữ nguyên fallback khi SSM ném lỗi', async () => {
    process.env.DB_PASSWORD_PARAM = '/sms/dev/db-password';
    process.env.DB_PASSWORD = 'fallback-db-pass';
    process.env.JWT_SECRET_PARAM = '/sms/dev/jwt-secret';
    process.env.JWT_SECRET = 'fallback-jwt-secret';

    const mockSend = jest.fn().mockRejectedValue(new Error('AccessDeniedException: User is not authorized'));
    const mockClient = { send: mockSend };
    const mockLogger = { error: jest.fn(), info: jest.fn() };

    await loadSecrets({ ssmClient: mockClient, logger: mockLogger });

    expect(mockLogger.error).toHaveBeenCalledTimes(2);
    expect(process.env.DB_PASSWORD).toBe('fallback-db-pass');
    expect(process.env.JWT_SECRET).toBe('fallback-jwt-secret');
  });
});
