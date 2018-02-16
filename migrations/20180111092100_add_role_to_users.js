exports.up = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.integer('role').nullable().defaultTo(null);
    table.foreign('role')
      .references('id')
      .inTable('role')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('role');
  });
};
