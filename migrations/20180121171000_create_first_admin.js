const requireEnvs = require('../src/util/require-envs');
var crypto = require('crypto');
requireEnvs(['CRYPTO_PASSWORD']);

exports.up = function(knex, Promise) {
  const cipher = crypto.createCipher('aes192', process.env.CRYPTO_PASSWORD);
  var email = cipher.update('admin@admin.admin', 'utf8', 'hex');
  email += cipher.final('hex');
  var password = '21232f297a57a5a743894a0e4a801fc3';
  return knex('role').insert({ email: email, password: password, admin: true, activated: true })
};

exports.down = function(knex, Promise) {
  const cipher = crypto.createCipher('aes192', process.env.CRYPTO_PASSWORD);
  var email = cipher.update('admin@admin.admin', 'utf8', 'hex');
  email += cipher.final('hex');
  return knex('role').where('email', email).del()
};
