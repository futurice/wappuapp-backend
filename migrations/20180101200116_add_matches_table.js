
exports.up = function(knex, Promise) {
    return knex.schema.createTable('matches', function(table) {
      table.bigIncrements('id').primary().index();
      table.integer('userId1').notNullable().index();
      table.integer('userId2').notNullable().index();
      table.string('opinion1').defaultTo(null);
      table.string('opinion2').defaultTo(null);
      table.string('firebaseChatId').defaultTo(null);
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('heilas');
};
