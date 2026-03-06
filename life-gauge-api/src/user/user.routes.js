const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validator');
const auth = require('../middleware/authMiddleware');
const controller = require('./user.controller');

const router = Router();

router.use(auth);

router.get('/profile', controller.getProfile);

router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validate,
  controller.updateProfile
);

router.put(
  '/password',
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 8 }),
  ],
  validate,
  controller.changePassword
);

router.get('/settings', controller.getSettings);

router.put(
  '/settings',
  [
    body('llm_model').optional().trim(),
    body('llm_api_key').optional().trim(),
  ],
  validate,
  controller.updateSettings
);

module.exports = router;
