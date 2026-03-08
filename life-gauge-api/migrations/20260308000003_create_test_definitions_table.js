exports.up = async (knex) => {
  await knex.schema.createTable('test_definitions', (table) => {
    table.increments('id').unsigned().primary();
    table.string('test_key', 100).notNullable().unique();
    table.string('display_name', 255).notNullable();
    table.string('category', 100).notNullable();
    table.string('unit', 50).nullable();
    table.decimal('default_ref_min', 15, 4).nullable();
    table.decimal('default_ref_max', 15, 4).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').unsigned().notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('test_definitions');
};
