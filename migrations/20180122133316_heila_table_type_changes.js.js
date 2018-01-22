
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('heilas', function(table) {
    table.dropColumn('bio_looking_for');
    table.integer('bio_looking_for_type_id');
    table.foreign('bio_looking_for_type_id').references('heila_types.id');
  })
};

exports.down = function(knex, Promise) {
  
};
