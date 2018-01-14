var util = require('../src/util/seeds');

exports.seed = function(knex, Promise) {
  return util.insertOrUpdate(knex, 'users', {
    id: 1,
    team_id: 1,
    name: 'Hessu Kypärä',
    uuid: 'hessu'
  })
};
