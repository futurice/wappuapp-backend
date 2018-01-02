
exports.up = function(knex, Promise) {
  return knex.schema.table('users', function(t) {
    t.string('image_path').default('');
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function(t) {
    t.dropColumn('image_path');
  })
};
