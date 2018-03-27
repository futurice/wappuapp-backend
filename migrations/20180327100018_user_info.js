exports.up = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.string('info');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('info');
  });
};
