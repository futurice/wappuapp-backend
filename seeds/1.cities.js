var util = require('../src/util/seeds');


exports.seed = function(knex, Promise) {
  return util.removeIfExists(knex, 'cities', {
    id: 1,
    name: 'Other',
  })
  .then(() => util.insertOrUpdate(knex, 'cities', {
    id: 2,
    name: 'Otaniemi',
  }))
  .then(() => util.insertOrUpdate(knex, 'cities', {
    id: 3,
    name: 'Tampere',
  }));
}
