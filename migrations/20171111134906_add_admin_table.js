
exports.up = function(knex, Promise) {
  return knex.schema.createTable('admin', function(table) {
    table.increments('id').primary().index();
    table.string('username').notNullable().index();
    table.string('email').notNullable();
    table.string('password').notNullable();
    table.integer('power').notNullable().defaultTo(0);
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('admin');
};
