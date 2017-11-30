
exports.up = function(knex, Promise) {
  return knex.schema.table('users', function(t) {
    t.boolean('heila').default(false);
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function(t) {
    t.dropColumn('heila');
  })
};
