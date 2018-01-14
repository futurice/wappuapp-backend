
exports.up = function(knex, Promise)
{
  return knex.schema.createTable('feedback', function(table)
  {
    table.bigIncrements('id').primary().index();
    table.integer('event_id').notNullable().unique().index();
    table.foreign('event_id')
    .references('id')
    .inTable('events')
    .onDelete('RESTRICT')
    .onUpdate('CASCADE');
    table.string('uuid').notNullable().unique().index();

    table.text('feeback_text','longtext');
    table.integer('grade');

    table.timestamps(true,true);
  });

};

exports.down = function(knex, Promise)
{
  return knex.schema.dropTable('feedback')
};
