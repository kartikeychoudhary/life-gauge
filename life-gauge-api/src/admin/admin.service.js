const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { NotFoundError, ConflictError } = require('../common/errors');

// ─── General Settings ───

const getAppSettings = async () => {
  const rows = await db('app_settings').select('setting_key', 'setting_value');
  const settings = {};
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value;
  }
  return settings;
};

const updateAppSetting = async (key, value) => {
  const existing = await db('app_settings').where({ setting_key: key }).first();
  if (existing) {
    await db('app_settings').where({ setting_key: key }).update({
      setting_value: String(value),
      updated_at: db.fn.now(),
    });
  } else {
    await db('app_settings').insert({
      setting_key: key,
      setting_value: String(value),
    });
  }
  return getAppSettings();
};

// ─── User Management ───

const listUsers = async () => {
  return db('users')
    .select('id', 'name', 'email', 'role', 'force_password_change', 'created_at', 'updated_at')
    .orderBy('created_at', 'asc');
};

const createUser = async ({ name, email, password, role = 'user' }) => {
  const existing = await db('users').where({ email }).first();
  if (existing) throw new ConflictError('Email already in use');

  const password_hash = await bcrypt.hash(password, 12);
  const [id] = await db('users').insert({
    name,
    email,
    password_hash,
    role,
    force_password_change: true,
  });

  // Create default settings row
  await db('user_settings').insert({ user_id: id });

  return db('users')
    .where({ id })
    .select('id', 'name', 'email', 'role', 'force_password_change', 'created_at')
    .first();
};

const deleteUser = async (userId, currentAdminId) => {
  if (userId === currentAdminId) {
    throw new ConflictError('Cannot delete your own account');
  }
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new NotFoundError('User not found');

  await db('user_settings').where({ user_id: userId }).delete();
  await db('health_test_results').where({ user_id: userId }).delete();
  await db('health_reports').where({ user_id: userId }).delete();
  await db('users').where({ id: userId }).delete();
};

const updateUserRole = async (userId, role, currentAdminId) => {
  if (userId === currentAdminId) {
    throw new ConflictError('Cannot change your own role');
  }
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new NotFoundError('User not found');

  await db('users').where({ id: userId }).update({ role, updated_at: db.fn.now() });
  return db('users')
    .where({ id: userId })
    .select('id', 'name', 'email', 'role', 'force_password_change', 'created_at')
    .first();
};

const resetUserPassword = async (userId, newPassword) => {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new NotFoundError('User not found');

  const password_hash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ id: userId }).update({
    password_hash,
    force_password_change: true,
    updated_at: db.fn.now(),
  });
};

// ─── Test Definitions ───

const listTestDefinitions = async () => {
  return db('test_definitions').orderBy('sort_order', 'asc');
};

const createTestDefinition = async (data) => {
  const existing = await db('test_definitions').where({ test_key: data.test_key }).first();
  if (existing) throw new ConflictError(`Test key '${data.test_key}' already exists`);

  // Get next sort_order
  const maxSort = await db('test_definitions').max('sort_order as max').first();
  const sortOrder = (maxSort.max || 0) + 1;

  const [id] = await db('test_definitions').insert({
    test_key: data.test_key,
    display_name: data.display_name,
    category: data.category,
    unit: data.unit || null,
    default_ref_min: data.default_ref_min || null,
    default_ref_max: data.default_ref_max || null,
    is_active: data.is_active !== undefined ? data.is_active : true,
    sort_order: sortOrder,
  });

  return db('test_definitions').where({ id }).first();
};

const updateTestDefinition = async (id, data) => {
  const existing = await db('test_definitions').where({ id }).first();
  if (!existing) throw new NotFoundError('Test definition not found');

  if (data.test_key && data.test_key !== existing.test_key) {
    const conflict = await db('test_definitions').where({ test_key: data.test_key }).whereNot({ id }).first();
    if (conflict) throw new ConflictError(`Test key '${data.test_key}' already exists`);
  }

  const updates = { updated_at: db.fn.now() };
  if (data.test_key !== undefined) updates.test_key = data.test_key;
  if (data.display_name !== undefined) updates.display_name = data.display_name;
  if (data.category !== undefined) updates.category = data.category;
  if (data.unit !== undefined) updates.unit = data.unit;
  if (data.default_ref_min !== undefined) updates.default_ref_min = data.default_ref_min;
  if (data.default_ref_max !== undefined) updates.default_ref_max = data.default_ref_max;
  if (data.is_active !== undefined) updates.is_active = data.is_active;
  if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

  await db('test_definitions').where({ id }).update(updates);
  return db('test_definitions').where({ id }).first();
};

const deleteTestDefinition = async (id) => {
  const existing = await db('test_definitions').where({ id }).first();
  if (!existing) throw new NotFoundError('Test definition not found');
  await db('test_definitions').where({ id }).delete();
};

// ─── Public helper (used by auth to check signup) ───

const isSignupAllowed = async () => {
  const setting = await db('app_settings').where({ setting_key: 'allow_signups' }).first();
  return setting ? setting.setting_value === 'true' : false;
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
  isSignupAllowed,
};
