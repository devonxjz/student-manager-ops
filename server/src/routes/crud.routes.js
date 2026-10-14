const validate = require('../middlewares/validate');
const ah = require('../utils/asyncHandler');

/**
 * Gắn 5 route CRUD chuẩn cho một controller:
 *   GET    path        -> list      POST   path      -> create
 *   GET    path/:id    -> get       PUT    path/:id  -> update
 *                                  DELETE path/:id  -> remove
 * @param guards middleware chạy trước mọi route (VD classOwnership)
 * @param rules  luật express-validator cho create/update
 */
module.exports = function mountCrud(router, path, ctrl, { guards = [], rules = [] } = {}) {
  router.get(path, ...guards, ah(ctrl.list));
  router.get(`${path}/:id`, ...guards, ah(ctrl.get));
  router.post(path, ...guards, rules, validate, ah(ctrl.create));
  router.put(`${path}/:id`, ...guards, rules, validate, ah(ctrl.update));
  router.delete(`${path}/:id`, ...guards, ah(ctrl.remove));
  return router;
};
