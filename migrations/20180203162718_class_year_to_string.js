
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('heilas', (table) => {
    table.string('class_year').nullable().alter();
  });
};

exports.down = function(knex, Promise) {
  
};
