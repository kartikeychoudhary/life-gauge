exports.up = (knex) =>
  knex.schema.createTable('health_reports', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.date('report_date').nullable();
    t.string('original_filename', 255).notNullable();
    t.string('file_path', 500).notNullable();
    t.longtext('raw_text').nullable();
    t.json('parsed_json').nullable();
    t.string('gemini_model_used', 100).nullable();
    t.enu('status', ['pending', 'processing', 'completed', 'failed']).notNullable().defaultTo('pending');
    t.text('error_message').nullable();
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('health_reports');
