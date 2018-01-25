
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('heilas', table => {
    table.integer('class_year').nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('heilas', table => {
    table.dropColumn('class_year');
  });
};
