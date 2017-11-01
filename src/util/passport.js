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
  (SELECT users.username FROM users WHERE users.username = ${username})
  `;
  return knex.raw(sqlString)
  .then(result => {
    const rows = result.rows;
    if (_.isEmpty(rows)) {
      return done(null, false)
    }
    let sqlString = `
    (SELECT users.password FROM users WHERE users.username = ${username})
    `;
    return knex.raw(sqlString)
    .then(result => {
      const pw = result.rows;
      if (pw[0] != crypto.createHash('md5').update(password).digest("hex")) {
        return done(null, false);
      }
      return done(null, user)
    });
  });
});

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: "SECRET"
};

const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  let sqlString = `
  (SELECT users.is FROM users WHERE users.id = ${payload.sub})
  `;
  return knex.raw(sqlString)
  .then(result => {
    const rows = result.rows;
    if (_.isEmpty(rows)) {
      return done(null, false)
    }
    return done(null, user)
  });
});

passport.use(jwtLogin);
passport.use(localLogin);
