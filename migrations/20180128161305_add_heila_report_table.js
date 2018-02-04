
exports.up = function(knex, Promise) {
  return knex.schema.createTable('heila_reports', function(table) {
    table.increments('id').primary().index();
    table.integer('reporter_uuid');
    table.integer('bad_profile_id');
    table.string('text', 500);
    table.timestamp('created_at').index().notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('heila_reports');
};
