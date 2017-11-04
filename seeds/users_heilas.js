var util = require('../src/util/seeds');

exports.seed = function(knex, Promise) {
  return util.insertOrUpdate(knex, 'heilas', {
    id: 2,
    uuid: '2002',
    image_path: 'https://storage.googleapis.com/whappu-backend/heilas/xVAFH9ZH_400x400.jpg'
  });
};
