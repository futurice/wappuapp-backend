exports.up = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.string('profile_picture_url');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('profile_picture_url');
  });
};
