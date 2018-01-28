// Everything required here must be in dependencies, not devDependencies
// because this file is also run in production environment
var path = require('path');
var requireEnvs = require('./src/util/require-envs');
requireEnvs(['DATABASE_URL']);

var connection = process.env.DATABASE_URL + '?charset=utf-8';
if (process.env.NODE_ENV === 'production') {
  // Heroku postgres uses ssl
  connection += '&ssl=true';
}

var databaseConfig = {
  client: 'pg',
  connection: connection,
  pool: {
    min: 2,
    max: 10,
    ping: function pingDatabase(conn, cb) {
      conn.query('SELECT 1', cb);
    }
  },
  debug: process.env.DEBUG_DATABASE === 'true',
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'migrations'
  }
};

// All possible NODE_ENVs should be listed here
// This is issue with knex
// See https://github.com/tgriesser/knex/issues/328
var envs = {
  development: databaseConfig,
  test: databaseConfig,
  production: databaseConfig,

  // Expose this for database.js
  config: databaseConfig
};

if (!envs.hasOwnProperty(process.env.NODE_ENV)) {
  console.error('NODE_ENV is not set!');
  console.error('Set NODE_ENV manually, or running e.g. source .env');
  console.error('\n');
  throw new Error('Environment is not set');
}

function censorPgConnectionString(str) {
  var regex = /^(postgres):\/\/(.*):(.*)@(.*:[0-9]*\/.*)$/;
  if (str.match(regex) !== null) {
    return str.replace(regex, '$1://$2:HIDDEN_PASSWORD@$4');
  }
  return 'CENSORED CONNECTION STRING';
}

console.log('DATABASE_URL=' + censorPgConnectionString(databaseConfig.connection));

module.exports = envs;
