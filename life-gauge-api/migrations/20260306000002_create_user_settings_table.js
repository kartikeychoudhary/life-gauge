exports.up = (knex) =>
  knex.schema.createTable('user_settings', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.text('llm_api_key_encrypted').nullable();
    t.string('llm_api_key_iv', 64).nullable();
    t.string('llm_api_key_tag', 64).nullable();
    t.string('llm_model', 100).nullable().defaultTo('gemini-2.0-flash');
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('user_settings');
