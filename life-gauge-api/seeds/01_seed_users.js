const bcrypt = require('bcryptjs');

exports.seed = async (knex) => {
  // Only seed if no users exist (idempotent — safe to run on every startup)
  const existing = await knex('users').first();
  if (existing) return;

  const hash = await bcrypt.hash('admin', 12);
  const [userId] = await knex('users').insert({
    name: 'admin',
    email: 'admin',
    password_hash: hash,
    role: 'admin',
    force_password_change: true,
  });
  await knex('user_settings').insert({
    user_id: userId,
    llm_model: 'gemini-2.0-flash',
  });
};
