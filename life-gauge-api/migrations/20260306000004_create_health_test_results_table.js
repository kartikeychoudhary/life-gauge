exports.up = (knex) =>
  knex.schema.createTable('health_test_results', (t) => {
    t.increments('id').primary();
    t.integer('report_id').unsigned().notNullable().references('id').inTable('health_reports').onDelete('CASCADE');
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('test_key', 100).notNullable();
    t.string('display_name', 255).notNullable();
    t.string('category', 100).notNullable().defaultTo('Other');
    t.decimal('value_numeric', 15, 4).nullable();
    t.string('value_text', 255).notNullable();
    t.string('unit', 50).nullable();
    t.decimal('ref_min', 15, 4).nullable();
    t.decimal('ref_max', 15, 4).nullable();
    t.string('ref_display', 100).nullable();
    t.enu('flag', ['normal', 'high', 'low', 'abnormal', 'unknown']).notNullable().defaultTo('unknown');
    t.date('report_date').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index(['user_id', 'test_key', 'report_date']);
  });

exports.down = (knex) => knex.schema.dropTable('health_test_results');
