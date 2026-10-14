// Controller CRUD dùng chung: nhận req, gọi crud.service, trả JSON.
// `scope(req)` quyết định phạm vi theo role/URL, VD giáo viên: (req) => ({ classId: req.params.classId }).
// Cùng một service sinh viên được dùng cho admin (không scope) và giáo viên (scope theo lớp).
const { metaFromReq } = require('../services/audit.service');

module.exports = function createCrudController(service, { scope = () => ({}) } = {}) {
  return {
    list: async (req, res) => {
      const { q, ...filters } = req.query;
      res.json(await service.list({ scope: scope(req), q, filters }));
    },
    get: async (req, res) => {
      res.json(await service.get(req.params.id, scope(req)));
    },
    create: async (req, res) => {
      res.status(201).json(await service.create(req.body, scope(req), metaFromReq(req)));
    },
    update: async (req, res) => {
      res.json(await service.update(req.params.id, req.body, scope(req), metaFromReq(req)));
    },
    remove: async (req, res) => {
      await service.remove(req.params.id, scope(req), metaFromReq(req));
      res.status(204).end();
    },
  };
};
