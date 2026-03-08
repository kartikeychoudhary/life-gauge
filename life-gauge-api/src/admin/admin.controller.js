const adminService = require('./admin.service');

// ─── General Settings ───

const getAppSettings = async (req, res, next) => {
  try {
    const settings = await adminService.getAppSettings();
    res.json(settings);
  } catch (err) { next(err); }
};

const updateAppSetting = async (req, res, next) => {
  try {
    const settings = await adminService.updateAppSetting(req.body.key, req.body.value);
    res.json(settings);
  } catch (err) { next(err); }
};

// ─── User Management ───

const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.listUsers();
    res.json(users);
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(parseInt(req.params.id), req.user.id);
    res.status(204).end();
  } catch (err) { next(err); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await adminService.updateUserRole(parseInt(req.params.id), req.body.role, req.user.id);
    res.json(user);
  } catch (err) { next(err); }
};

const resetUserPassword = async (req, res, next) => {
  try {
    await adminService.resetUserPassword(parseInt(req.params.id), req.body.password);
    res.json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

// ─── Test Definitions ───

const listTestDefinitions = async (req, res, next) => {
  try {
    const defs = await adminService.listTestDefinitions();
    res.json(defs);
  } catch (err) { next(err); }
};

const createTestDefinition = async (req, res, next) => {
  try {
    const def = await adminService.createTestDefinition(req.body);
    res.status(201).json(def);
  } catch (err) { next(err); }
};

const updateTestDefinition = async (req, res, next) => {
  try {
    const def = await adminService.updateTestDefinition(parseInt(req.params.id), req.body);
    res.json(def);
  } catch (err) { next(err); }
};

const deleteTestDefinition = async (req, res, next) => {
  try {
    await adminService.deleteTestDefinition(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
};

module.exports = {
  getAppSettings,
  updateAppSetting,
  listUsers,
  createUser,
  deleteUser,
  updateUserRole,
  resetUserPassword,
  listTestDefinitions,
  createTestDefinition,
  updateTestDefinition,
  deleteTestDefinition,
};
