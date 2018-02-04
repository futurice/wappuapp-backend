var util = require('../src/util/seeds');

exports.seed = function(knex, Promise) {
  return util.insertOrUpdate(knex, 'heila_types', {
    id: 1,
    type: 'New buddies to spend this Wappu with'
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'heila_types', {
      id: 2,
      type: 'Light-hearted fun'
    })
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'heila_types', {
      id: 3,
      type: 'Serious romantic buzz!!'
    })
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'heila_types', {
      id: 4,
      type: 'Philosophical debates about the true nature of Wappu'
    })
  })
};
