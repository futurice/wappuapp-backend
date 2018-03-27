exports.up = function(knex, Promise) {
  return knex.schema.createTable('comments', function(table) {
    table
      .increments('id')
      .primary()
      .index();
    table.string('text').nullable();
    table.string('image_path').nullable();

    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .index();
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .integer('feed_item_id')
      .unsigned()
      .notNullable()
      .index();
    table
      .foreign('feed_item_id')
      .references('id')
      .inTable('feed_items')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .timestamp('created_at')
      .notNullable()
      .defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('comments');
};
