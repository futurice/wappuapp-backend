exports.up = function(knex, Promise) {
  return knex.schema.createTable("feed_item_reports", function(table) {
    table
      .increments("id")
      .primary()
      .index();
    table.integer("feed_item_id").notNullable();
    table
      .foreign("feed_item_id")
      .references("id")
      .inTable("feed_items")
      .onDelete("CASCADE");
    table.string("report_creator_id").notNullable();
    table
      .foreign("report_creator_id")
      .references("uuid")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now());
    table.text("report_description");
    table
      .boolean("is_resolved")
      .notNullable()
      .defaultTo("false");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("feed_item_reports");
};
