// Đặt giới hạn TRƯỚC khi nạp app (config đọc env lúc require)
process.env.LOGIN_RATE_MAX = '3';

const {
  app, request, PASSWORD, resetDb, createAdmin,
} = require('./helpers');

// Mô phỏng chuỗi proxy thật: client -> ALB -> nginx -> Node.
// Socket là nginx (127.0.0.1), X-Forwarded-For = "<client>, <ALB>".
const login = (clientIp, password) => request(app)
  .post('/api/auth/login')
  .set('X-Forwarded-For', `${clientIp}, 10.0.1.5`)
  .send({ username: 'admin', password });

beforeEach(async () => {
  await resetDb();
  await createAdmin();
});

describe('rate limit đăng nhập', () => {
  test('sai quá giới hạn thì trả 429 (kể cả khi nhập đúng mật khẩu sau đó)', async () => {
    const ip = '203.0.113.10';
    for (let i = 0; i < 3; i += 1) expect((await login(ip, 'sai')).status).toBe(401);

    const blocked = await login(ip, 'sai');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/quá nhiều lần/);
    expect(blocked.headers['retry-after']).toBeDefined();

    expect((await login(ip, PASSWORD)).status).toBe(429);
  });

  test('IP khác không bị ảnh hưởng (trust proxy lấy đúng IP client, không gộp thành IP của ALB)', async () => {
    for (let i = 0; i < 4; i += 1) await login('203.0.113.20', 'sai');
    expect((await login('203.0.113.20', 'sai')).status).toBe(429);

    expect((await login('203.0.113.21', PASSWORD)).status).toBe(200);
  });

  test('đăng nhập đúng không bị đếm vào giới hạn', async () => {
    const ip = '203.0.113.30';
    for (let i = 0; i < 6; i += 1) expect((await login(ip, PASSWORD)).status).toBe(200);
    expect((await login(ip, 'sai')).status).toBe(401);
  });
});
