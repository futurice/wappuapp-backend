
exports.up = function(knex, Promise) {
    return knex.schema.createTable('heilas', function(table) {
      table.integer('userId').notNullable().unique().primary().index();
      table.foreign('userId')
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE')

      table.string('uuid').notNullable().unique().index();
      table.foreign('uuid')
        .references('uuid')
        .inTable('users')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');

      table.string('bio_text', 250);
      table.string('bio_looking_for', 250);
      table.timestamp('created_at').index().notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').index().notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('heilas');
};
