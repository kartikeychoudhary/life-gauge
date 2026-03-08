exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.enum('role', ['user', 'admin']).notNullable().defaultTo('user').after('password_hash');
    table.boolean('force_password_change').notNullable().defaultTo(false).after('role');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('force_password_change');
    table.dropColumn('role');
  });
};
