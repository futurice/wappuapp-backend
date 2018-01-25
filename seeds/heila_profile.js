var util = require('../src/util/seeds');

exports.seed = function(knex, Promise) {
  return util.insertOrUpdate(knex, 'heilas', {
    userId: 1,
    uuid: 'hessu',
    bio_text: 'Olen hessuista hassuin!',
    bio_looking_for_type_id: 2,
  }, 'userId')
  .then(() => {
    return util.insertOrUpdate(knex, 'users', {
      id: 1,
      heila: true,
    })
  })
};
