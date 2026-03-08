const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { encrypt, decrypt } = require('../common/encrypt');
const { NotFoundError, UnauthorizedError, ConflictError } = require('../common/errors');

const getProfile = async (userId) => {
  const user = await db('users')
    .where({ id: userId })
    .select('id', 'name', 'email', 'role', 'force_password_change', 'created_at')
    .first();
  if (!user) throw new NotFoundError('User not found');
  return user;
};

const updateProfile = async (userId, { name, email }) => {
  if (email) {
    const existing = await db('users').where({ email }).whereNot({ id: userId }).first();
    if (existing) throw new ConflictError('Email already in use');
  }
  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  updates.updated_at = db.fn.now();

  await db('users').where({ id: userId }).update(updates);
  return getProfile(userId);
};

const changePassword = async (userId, { current_password, new_password }) => {
  const user = await db('users').where({ id: userId }).first();
  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  const password_hash = await bcrypt.hash(new_password, 12);
  await db('users').where({ id: userId }).update({
    password_hash,
    force_password_change: false,
    updated_at: db.fn.now(),
  });
};

const getSettings = async (userId) => {
  const settings = await db('user_settings').where({ user_id: userId }).first();
  if (!settings) return { llm_model: null, has_api_key: false };
  return {
    llm_model: settings.llm_model,
    has_api_key: !!settings.llm_api_key_encrypted,
  };
};

const updateSettings = async (userId, { llm_api_key, llm_model }) => {
  const updates = { updated_at: db.fn.now() };
  if (llm_model !== undefined) updates.llm_model = llm_model;
  if (llm_api_key !== undefined && llm_api_key !== '') {
    const { encrypted, iv, tag } = encrypt(llm_api_key);
    updates.llm_api_key_encrypted = encrypted;
    updates.llm_api_key_iv = iv;
    updates.llm_api_key_tag = tag;
  }
  const existing = await db('user_settings').where({ user_id: userId }).first();
  if (existing) {
    await db('user_settings').where({ user_id: userId }).update(updates);
  } else {
    await db('user_settings').insert({ user_id: userId, ...updates });
  }
  return getSettings(userId);
};

const getDecryptedApiKey = async (userId) => {
  const settings = await db('user_settings').where({ user_id: userId }).first();
  if (!settings || !settings.llm_api_key_encrypted) return null;
  return decrypt(settings.llm_api_key_encrypted, settings.llm_api_key_iv, settings.llm_api_key_tag);
};

module.exports = { getProfile, updateProfile, changePassword, getSettings, updateSettings, getDecryptedApiKey };
