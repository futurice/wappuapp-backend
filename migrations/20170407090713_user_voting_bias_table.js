
exports.up = function(knex, Promise) {
  return knex.schema.createTable('voter_biases', function(table) {
    table.increments('id').primary().index();
    table.float('bias').notNullable().defaultTo(0.0);

    table.integer('team_id').unsigned().notNullable().index();
    table.foreign('team_id')
      .references('id')
      .inTable('teams')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.integer('user_id').unsigned().notNullable().index();
    table.foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  })
  .raw(`
    CREATE UNIQUE INDEX
      only_one_bias_per_team
    ON
      voter_biases(user_id, team_id)
  `);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('voter_biases');
};
