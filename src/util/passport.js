import _ from 'lodash';
import passport from 'passport';
import moment from 'moment';
import {Strategy, ExtractJwt} from 'passport-jwt';
import LocalStrategy from 'passport-local';
const {knex} = require('../util/database').connect();
import crypto from 'crypto';

const localOptions = {
  usernameField: 'username'
};
const localLogin = new LocalStrategy(localOptions, (username, password, done) => {
  return knex('admin').select('username').where('username', username)
  .then(result => {
    const rows = result.rows;
    if (_.isEmpty(rows)) {
      return done(null, false)
    }
    return knex('admin').select('password').where('username', username).first()
    .then(result => {
      const pw = result.password;
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
  return knex('admin').select('id').where('id', payload.sub)
  .then(result => {
    const rows = result.rows;
    if (_.isEmpty(rows)) {
      return done(null, false)
    }
    const startTime = moment(payload.iat)
    const nowTime = moment(new Date().getTime())
    const timeSpent = nowTime.diff(startTime, 'hours')
    if (timeSpent > 24) {
      return done(null, false)
    } else {
      return done(null, true)
    }
  });
});

passport.use(jwtLogin);
passport.use(localLogin);
