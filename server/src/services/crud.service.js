// Service CRUD dùng chung cho mọi resource (môn học, lớp, giáo viên, sinh viên...).
// Các service cụ thể chỉ khai báo cấu hình; khác biệt giữa các role (admin thấy tất cả, giáo viên chỉ
// thấy lớp mình) được truyền vào qua `scope` ở từng lần gọi, KHÔNG viết lại logic thêm/sửa/xoá.
//
// scope: điều kiện where bắt buộc, VD { classId: 3 }. Nó được:
//   - AND vào mọi truy vấn list/get/update/remove -> không chạm được bản ghi ngoài phạm vi (trả 404)
//   - ép vào dữ liệu khi create -> không tạo được bản ghi ngoài phạm vi
//   - loại khỏi dữ liệu khi update -> không "chuyển" bản ghi ra khỏi phạm vi
const { Op, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('../utils/AppError');
const audit = require('./audit.service');

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

// Chỉ lấy các key có mặt trong data (giữ cả giá trị null để cho phép xoá giá trị, VD bỏ GVCN)
const pick = (data = {}, fields = []) =>
  fields.reduce((out, f) => (has(data, f) && data[f] !== undefined ? { ...out, [f]: data[f] } : out), {});

const omit = (data, keys) => Object.fromEntries(Object.entries(data).filter(([k]) => !keys.includes(k)));

/**
 * @param {import('sequelize').ModelStatic<any>} Model
 * @param {object}   opts
 * @param {string}   opts.name        tên hiển thị trong thông báo lỗi ("sinh viên")
 * @param {string[]} opts.fields      whitelist trường được phép tạo/sửa
 * @param {string[]} [opts.searchable] trường tìm theo ?q= (LIKE %q%)
 * @param {string[]} [opts.filterable] trường lọc chính xác theo query (?classId=1)
 * @param {Array}    [opts.order]     thứ tự mặc định cho list
 * @param {Array}    [opts.include]   association kèm theo khi list/get
 * @param {object}   [opts.attributes] attributes cho list/get (VD thêm cột đếm)
 * @param {(records: any[]) => Promise<object[]>} [opts.decorate]
 *   biến mảng bản ghi thành object JSON trả cho FE (thêm cột tính toán, làm phẳng quan hệ).
 *   Nhận cả mảng để gom truy vấn phụ thành 1 lần, tránh N+1.
 * @param {string|{entity:string,prefix:string}} [opts.audit]
 *   bật ghi audit_logs. 'students' -> entity_type 'students', action STUDENT_CREATED/UPDATED/DELETED
 * @param {object}   [opts.hooks]     chạy TRONG transaction, ctx = { transaction, scope, input }
 *   beforeCreate(payload, ctx) -> payload mới   (VD tạo tài khoản đăng nhập trước)
 *   afterCreate(record, ctx)
 *   beforeUpdate(record, changes, ctx) -> changes mới
 *   afterUpdate(record, changes, ctx)              (VD đồng bộ username khi đổi mã)
 *   beforeRemove(record, ctx)
 *   afterRemove(record, ctx)                       (VD xoá tài khoản đăng nhập)
 */
function createCrudService(Model, opts) {
  const {
    name = Model.name,
    fields,
    searchable = [],
    filterable = [],
    order = [['id', 'ASC']],
    include = [],
    attributes,
    hooks = {},
    decorate,
    audit: auditOpt,
  } = opts;
  const { sequelize } = Model;

  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error(`createCrudService(${Model.name}): cần khai báo fields`);
  }

  // 'classes' -> CLASS, 'courses' -> COURSE
  const auditCfg = typeof auditOpt === 'string'
    ? { entity: auditOpt, prefix: auditOpt.replace(/(ss)es$|s$/, '$1').toUpperCase() }
    : auditOpt;

  const writeAudit = (verb, entityId, oldValue, newValue, meta, transaction) => auditCfg && audit.log({
    action: `${auditCfg.prefix}_${verb}`, entityType: auditCfg.entity, entityId, oldValue, newValue,
  }, meta, { transaction });

  const finalize = async (records) => (decorate ? decorate(records) : records);

  const notFound = () => new AppError(`Không tìm thấy ${name}`, 404);

  const findInScope = (id, scope = {}, extra = {}) =>
    Model.findOne({ where: { ...scope, id }, ...extra });

  // Lỗi khoá ngoại: khi xoá = còn dữ liệu phụ thuộc (409); khi tạo/sửa = tham chiếu không tồn tại (400)
  const mapFkError = (err, action) => {
    if (!(err instanceof ForeignKeyConstraintError)) return err;
    return action === 'remove'
      ? new AppError(`Không thể xoá ${name} vì còn dữ liệu liên quan`, 409)
      : new AppError('Dữ liệu tham chiếu không tồn tại', 400);
  };

  const inTransaction = async (action, fn) => {
    try {
      return await sequelize.transaction(fn);
    } catch (err) {
      throw mapFkError(err, action);
    }
  };

  async function list({ scope = {}, q, filters = {} } = {}) {
    const where = { ...pick(filters, filterable), ...scope }; // scope luôn thắng filter
    if (q && searchable.length) {
      where[Op.or] = searchable.map((f) => ({ [f]: { [Op.like]: `%${q}%` } }));
    }
    return finalize(await Model.findAll({ where, include, attributes, order }));
  }

  async function get(id, scope = {}) {
    const record = await findInScope(id, scope, { include, attributes });
    if (!record) throw notFound();
    return (await finalize([record]))[0];
  }

  // meta = { actorId, requestId, ip } -> dùng cho audit_logs
  async function create(input = {}, scope = {}, meta = {}) {
    const id = await inTransaction('create', async (transaction) => {
      const ctx = { transaction, scope, input, meta };
      let payload = { ...pick(input, fields), ...scope };
      if (hooks.beforeCreate) payload = await hooks.beforeCreate(payload, ctx);
      const record = await Model.create(payload, { transaction });
      if (hooks.afterCreate) await hooks.afterCreate(record, ctx);
      await writeAudit('CREATED', record.id, null, record, meta, transaction);
      return record.id;
    });
    return get(id, scope); // đọc lại để có include/attributes giống list
  }

  async function update(id, input = {}, scope = {}, meta = {}) {
    await inTransaction('update', async (transaction) => {
      const ctx = { transaction, scope, input, meta };
      const record = await findInScope(id, scope, { transaction });
      if (!record) throw notFound();
      let changes = omit(pick(input, fields), Object.keys(scope));
      if (hooks.beforeUpdate) changes = await hooks.beforeUpdate(record, changes, ctx);
      const before = pick(record.get({ plain: true }), Object.keys(changes));
      await record.update(changes, { transaction });
      await writeAudit('UPDATED', record.id, before, changes, meta, transaction);
      if (hooks.afterUpdate) await hooks.afterUpdate(record, changes, ctx);
    });
    return get(id, scope);
  }

  async function remove(id, scope = {}, meta = {}) {
    await inTransaction('remove', async (transaction) => {
      const ctx = { transaction, scope, meta };
      const record = await findInScope(id, scope, { transaction });
      if (!record) throw notFound();
      if (hooks.beforeRemove) await hooks.beforeRemove(record, ctx);
      await record.destroy({ transaction });
      await writeAudit('DELETED', record.id, record, null, meta, transaction);
      if (hooks.afterRemove) await hooks.afterRemove(record, ctx);
    });
  }

  return { Model, name, list, get, create, update, remove };
}

module.exports = createCrudService;
