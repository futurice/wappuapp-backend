
exports.up = function(knex, Promise) {
  return knex.raw(`
    ALTER TABLE action_types
    ALTER COLUMN value TYPE decimal(10, 4);
  `);
};

exports.down = function(knex, Promise) {
  return knex.raw(`
    ALTER TABLE action_types
    ALTER COLUMN value TYPE integer;
  `);
};
