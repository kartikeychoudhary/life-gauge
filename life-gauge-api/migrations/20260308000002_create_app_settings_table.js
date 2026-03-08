exports.up = async (knex) => {
  await knex.schema.createTable('app_settings', (table) => {
    table.string('setting_key', 100).primary();
    table.text('setting_value').notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Insert default settings
  await knex('app_settings').insert([
    { setting_key: 'allow_signups', setting_value: 'false' },
  ]);
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('app_settings');
};
