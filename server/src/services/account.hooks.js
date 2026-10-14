// Hook dùng chung cho resource gắn với tài khoản đăng nhập (giáo viên, sinh viên):
//   tạo  -> tạo User (username = mã, mật khẩu = input.password hoặc mặc định = mã)
//   sửa mã/email -> đồng bộ username/email của tài khoản
//   xoá  -> xoá User
const { User } = require('../models');
const { createAccount } = require('./auth.service');

module.exports = function accountHooks({ role, codeField }) {
  return {
    beforeCreate: async (payload, { transaction, input }) => {
      const code = payload[codeField];
      const user = await createAccount({
        username: code, password: input.password || code, role, email: payload.email,
      }, { transaction });
      return { ...payload, userId: user.id };
    },
    afterUpdate: async (record, changes, { transaction }) => {
      const sync = {};
      if (changes[codeField]) sync.username = changes[codeField];
      if ('email' in changes) sync.email = changes.email || null;
      if (Object.keys(sync).length) await User.update(sync, { where: { id: record.userId }, transaction });
    },
    afterRemove: async (record, { transaction }) => {
      await User.destroy({ where: { id: record.userId }, transaction });
    },
  };
};
