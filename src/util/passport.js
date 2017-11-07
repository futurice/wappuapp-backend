import _ from 'lodash';
import passport from 'passport';
import {Strategy, ExtractJwt} from 'passport-jwt';
import LocalStrategy from 'passport-local';
const {knex} = require('../util/database').connect();
import crypto from 'crypto';

const localOptions = {
  usernameField: 'username'
};
const localLogin = new LocalStrategy(localOptions, (username, password, done) => {
  let sqlString = `
  (SELECT userit.username FROM userit WHERE userit.username = '${username}')
  `;
  return knex.raw(sqlString)
  .then(result => {
    const rows = result.rows;
    if (_.isEmpty(rows)) {
      return done(null, false)
    }
    sqlString = `
    (SELECT userit.password FROM userit WHERE userit.username = '${username}')
    `;
    return knex.raw(sqlString)
    .then(result => {
      const pw = result.rows[0].password;
      console.log(pw)
      if (pw != crypto.createHash('md5').update(password).digest("hex")) {
        return done(null, false);
      }
      return done(null, true)
    });
  });
});

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: "SECRET"
};

const jwtLogin = new Strategy(jwtOptions, (payload, done) => {
  let sqlString = `
  (SELECT userit.id FROM userit WHERE userit.id = '${payload.sub}')
  `;
  return knex.raw(sqlString)
  .then(result => {
    const rows = result.rows;
    if (_.isEmpty(rows)) {
      return done(null, false)
    }
    return done(null, true)
  });
});

passport.use(jwtLogin);
passport.use(localLogin);
