
exports.up = function(knex, Promise) {
    return knex.schema.createTable('heilas', function(table) {
      table.bigIncrements('id').primary().index();
      table.string('uuid').notNullable().unique().index();
      table.foreign('uuid')
        .references('uuid')
        .inTable('users')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');

      table.string('image_path');
      table.timestamp('created_at').index().notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').index().notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('heilas');
};
