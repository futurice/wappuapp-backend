var util = require('../src/util/seeds');

exports.seed = function(knex, Promise) {
  return util.insertOrUpdate(knex, 'users', {
    id: 1,
    team_id: 1,
    name: 'Hessu Kypärä',
    uuid: 'hessu'
  })
  .then(() => util.insertOrUpdate(knex, 'users', {
    id: 2,
    team_id: 2,
    name: 'Pate Pat',
    uuid: '2002'
  }))
};
