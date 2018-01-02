
exports.up = function(knex, Promise) {
    return knex.schema.createTable('matches', function(table) {
      table.bigIncrements('id').primary().index();
      table.string('from').notNullable().index();
      table.string('to').notNullable().index();
      table.string('opinion').notNullable();
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('heilas');
};
