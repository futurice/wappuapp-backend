
exports.up = function(knex, Promise)
{
  return knex.schema.createTable('feedback', function(table)
  {
    table.bigIncrements('id').primary().index();
    table.integer('event_id').notNullable().index();
    table.foreign('event_id')
      .references('id')
      .inTable('events')
    table.string('uuid').notNullable().index();
    table.text('feeback_text','longtext');
    table.integer('grade');
    table.timestamps(true, true);
  });

};

exports.down = function(knex, Promise)
{
  return knex.schema.dropTable('feedback')
};
