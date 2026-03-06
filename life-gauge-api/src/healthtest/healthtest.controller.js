const service = require('./healthtest.service');
const { verify } = require('../common/jwt');
const db = require('../config/db');

const list = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await service.listReports(req.user.id, { page, limit });
    res.json(result);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const report = await service.getReport(req.user.id, req.params.id);
    res.json(report);
  } catch (err) { next(err); }
};

const upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const report = await service.uploadAndProcess(req.user.id, req.file);
    res.status(201).json(report);
  } catch (err) { next(err); }
};

const reprocess = async (req, res, next) => {
  try {
    const report = await service.reprocessReport(req.user.id, req.params.id);
    res.json(report);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.deleteReport(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

const streamStatus = (req, res) => {
  // EventSource cannot send headers, so auth via query param
  let userId;
  try {
    const payload = verify(req.query.token);
    userId = payload.id;
  } catch {
    res.status(401).end();
    return;
  }

  const reportId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const poll = async () => {
    try {
      const report = await db('health_reports')
        .where({ id: reportId, user_id: userId })
        .select('status', 'error_message')
        .first();

      if (!report) {
        send({ status: 'not_found' });
        res.end();
        return;
      }

      send({ status: report.status, error_message: report.error_message });

      if (report.status === 'completed' || report.status === 'failed') {
        res.end();
      }
    } catch {
      res.end();
    }
  };

  poll();
  const interval = setInterval(poll, 2000);
  req.on('close', () => clearInterval(interval));
};

module.exports = { list, getOne, upload, reprocess, remove, streamStatus };
