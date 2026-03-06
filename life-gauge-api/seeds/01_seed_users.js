const bcrypt = require('bcryptjs');

exports.seed = async (knex) => {
  await knex('user_settings').del();
  await knex('users').del();

  const hash = await bcrypt.hash('password123', 12);
  const [userId] = await knex('users').insert({
    name: 'Dev User',
    email: 'dev@lifegauge.app',
    password_hash: hash,
  });
  await knex('user_settings').insert({
    user_id: userId,
    llm_model: 'gemini-2.0-flash',
  });
};
