const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validator');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const controller = require('./admin.controller');

const router = Router();

// All admin routes require auth + admin role
router.use(auth, admin);

// ─── General Settings ───

router.get('/settings', controller.getAppSettings);

router.put(
  '/settings',
  [
    body('key').trim().notEmpty().withMessage('Setting key is required'),
    body('value').notEmpty().withMessage('Setting value is required'),
  ],
  validate,
  controller.updateAppSetting
);

// ─── User Management ───

router.get('/users', controller.listUsers);

router.post(
  '/users',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],
  validate,
  controller.createUser
);

router.put(
  '/users/:id/role',
  [
    param('id').isInt(),
    body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],
  validate,
  controller.updateUserRole
);

router.put(
  '/users/:id/reset-password',
  [
    param('id').isInt(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  controller.resetUserPassword
);

router.delete('/users/:id', [param('id').isInt()], validate, controller.deleteUser);

// ─── Test Definitions ───

router.get('/test-definitions', controller.listTestDefinitions);

router.post(
  '/test-definitions',
  [
    body('test_key').trim().notEmpty().withMessage('Test key is required'),
    body('display_name').trim().notEmpty().withMessage('Display name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('unit').optional({ nullable: true }).trim(),
    body('default_ref_min').optional({ nullable: true }).isDecimal(),
    body('default_ref_max').optional({ nullable: true }).isDecimal(),
    body('is_active').optional().isBoolean(),
  ],
  validate,
  controller.createTestDefinition
);

router.put(
  '/test-definitions/:id',
  [
    param('id').isInt(),
    body('test_key').optional().trim().notEmpty(),
    body('display_name').optional().trim().notEmpty(),
    body('category').optional().trim().notEmpty(),
    body('unit').optional({ nullable: true }).trim(),
    body('default_ref_min').optional({ nullable: true }).isDecimal(),
    body('default_ref_max').optional({ nullable: true }).isDecimal(),
    body('is_active').optional().isBoolean(),
    body('sort_order').optional().isInt(),
  ],
  validate,
  controller.updateTestDefinition
);

router.delete('/test-definitions/:id', [param('id').isInt()], validate, controller.deleteTestDefinition);

module.exports = router;
