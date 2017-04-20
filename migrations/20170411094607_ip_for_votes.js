
exports.up = function(knex, Promise) {
  return knex.schema.table('votes', function(table) {
    table.string('ip', 30);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('votes', function(table) {
    table.dropColumn('ip');
  });
};
