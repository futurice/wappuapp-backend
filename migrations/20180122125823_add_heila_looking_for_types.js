
exports.up = function(knex, Promise) {
  return knex.schema.createTable('heila_types', function(table) {
    table.integer('id').primary().index();
    table.string('type').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('heila_types');
};
