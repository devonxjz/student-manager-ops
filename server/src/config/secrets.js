const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

/**
 * Tải bí mật từ AWS Systems Manager (SSM) Parameter Store vào biến môi trường process.env.
 * Phục vụ kế hoạch Tuần 3 (T1, T5): Không lưu mật khẩu DB và JWT Secret dạng plain text.
 * 
 * @param {Object} options - Tùy chọn cho việc đọc secret (tiện cho unit test)
 * @param {SSMClient} [options.ssmClient] - Instance SSMClient tùy chỉnh
 * @param {Object} [options.logger] - Logger tùy chỉnh (mặc định console)
 */
async function loadSecrets(options = {}) {
  const dbParamName = process.env.DB_PASSWORD_PARAM;
  const jwtParamName = process.env.JWT_SECRET_PARAM;

  // Nếu không có cấu hình param nào, bỏ qua
  if (!dbParamName && !jwtParamName) {
    return;
  }

  const logger = options.logger || console;
  const ssmClient = options.ssmClient || new SSMClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  const loaded = [];

  if (dbParamName) {
    try {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: dbParamName,
          WithDecryption: true,
        })
      );
      if (response?.Parameter?.Value) {
        process.env.DB_PASSWORD = response.Parameter.Value;
        loaded.push(dbParamName);
      }
    } catch (err) {
      logger.error?.(`Không đọc được mật khẩu DB từ SSM Parameter Store (${dbParamName}): ${err.message}. Sử dụng DB_PASSWORD hiện tại làm fallback.`);
    }
  }

  if (jwtParamName) {
    try {
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: jwtParamName,
          WithDecryption: true,
        })
      );
      if (response?.Parameter?.Value) {
        process.env.JWT_SECRET = response.Parameter.Value;
        loaded.push(jwtParamName);
      }
    } catch (err) {
      logger.error?.(`Không đọc được JWT Secret từ SSM Parameter Store (${jwtParamName}): ${err.message}. Sử dụng JWT_SECRET hiện tại làm fallback.`);
    }
  }

  if (loaded.length > 0) {
    logger.info?.(`Đã tải bí mật từ SSM Parameter Store thành công: ${loaded.join(', ')}`);
  }
}

module.exports = {
  loadSecrets,
};
