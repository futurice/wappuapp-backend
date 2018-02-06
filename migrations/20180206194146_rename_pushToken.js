exports.up = function(knex, Promise) {
  return knex.schema.table('heilas', t => {
    t.renameColumn('pushToken', 'push_token');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('heilas', t => {
    t.renameColumn('push_token', 'pushToken');
  });
};
