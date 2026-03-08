const db = require('../config/db');
const { ForbiddenError } = require('../common/errors');

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await db('users').where({ id: req.user.id }).select('role').first();
    if (!user || user.role !== 'admin') {
      return next(new ForbiddenError('Admin access required'));
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = adminMiddleware;
