const crypto = require('crypto');

const requireEnvs = require('../src/util/require-envs');
const util = require('../src/util/seeds');

exports.seed = (knex, promise) => {
  requireEnvs(['CRYPTO_PASSWORD']);
  const cipher = crypto.createCipher('aes192', process.env.CRYPTO_PASSWORD);
  var email = cipher.update('admin@admin.admin', 'utf8', 'hex');
  email += cipher.final('hex');
  var password = '21232f297a57a5a743894a0e4a801fc3';
  return util.insertOrUpdate(knex, 'role', {
    id: 1,
    email,
    password,
    admin: true,
    activated: true
  });
};
