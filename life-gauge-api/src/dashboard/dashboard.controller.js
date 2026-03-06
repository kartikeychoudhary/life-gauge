const service = require('./dashboard.service');

const getSummary = async (req, res, next) => {
  try {
    const data = await service.getSummary(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
};

const getTestHistory = async (req, res, next) => {
  try {
    const history = await service.getTestHistory(req.user.id, req.params.key);
    res.json(history);
  } catch (err) { next(err); }
};

module.exports = { getSummary, getTestHistory };
