
exports.up = function(knex, Promise) {
  return knex.schema.table('heilas', function(t) {
    t.string('pushToken').default(null);
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('heilas', function(t) {
    t.dropColumn('pushToken');
  })
};
