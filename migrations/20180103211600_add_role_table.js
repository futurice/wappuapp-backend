
exports.up = function(knex, Promise) {
  return knex.schema.createTable('role', function(table) {
    table.increments('id').primary().index();
    table.string('email').notNullable().index();
    table.string('password').notNullable();
    table.boolean('admin').notNullable().defaultTo(0);
    table.boolean('activated').notNullable().defaultTo(0);
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('role');
};
