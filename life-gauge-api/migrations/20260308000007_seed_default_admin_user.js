const bcrypt = require('bcryptjs');

/**
 * Data migration: create the default admin user if no users exist.
 * Credentials: email=admin, password=admin, force_password_change=true
 */
exports.up = async (knex) => {
  const existing = await knex('users').first();
  if (existing) return;

  const hash = await bcrypt.hash('admin', 12);
  const [userId] = await knex('users').insert({
    name: 'admin',
    email: 'admin@lifegauge.local',
    password_hash: hash,
    role: 'admin',
    force_password_change: true,
  });
  await knex('user_settings').insert({
    user_id: userId,
    llm_model: 'gemini-2.0-flash',
  });
};

exports.down = async (knex) => {
  const admin = await knex('users').where('email', 'admin').first();
  if (admin) {
    await knex('user_settings').where('user_id', admin.id).del();
    await knex('users').where('id', admin.id).del();
  }
};
