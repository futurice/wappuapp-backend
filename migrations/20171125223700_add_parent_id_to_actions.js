
exports.up = function(knex, Promise) {
  return knex.schema.table('actions', function(table) {
    table.integer('parent_id').defaultTo(null);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('actions', function(table) {
    table.dropColumn('parent_id');
  });
};
