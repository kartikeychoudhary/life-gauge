const { Router } = require('express');
const auth = require('../middleware/authMiddleware');
const controller = require('./dashboard.controller');

const router = Router();
router.use(auth);

router.get('/summary', controller.getSummary);
router.get('/test/:key/history', controller.getTestHistory);

module.exports = router;
