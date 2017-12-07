
exports.up = function(knex, Promise) {
  return knex.schema.table('feed_items', function(table) {
    table.integer('parent_id').defaultTo(null);
    table.foreign('parent_id')
    .references('id')
    .inTable('feed_items')
    .onDelete('CASCADE')
    .onUpdate('CASCADE');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('feed_items', function(table) {
    table.dropColumn('parent_id');
  });
};
