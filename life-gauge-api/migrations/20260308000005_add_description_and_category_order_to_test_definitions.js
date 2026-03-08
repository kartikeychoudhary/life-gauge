exports.up = async (knex) => {
  await knex.schema.alterTable('test_definitions', (table) => {
    table.text('description').nullable().after('category');
    table.integer('category_order').unsigned().notNullable().defaultTo(0).after('category');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('test_definitions', (table) => {
    table.dropColumn('description');
    table.dropColumn('category_order');
  });
};
