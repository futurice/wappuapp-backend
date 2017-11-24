import _ from 'lodash';
import passport from 'passport';
import moment from 'moment';
import {Strategy, ExtractJwt} from 'passport-jwt';
import LocalStrategy from 'passport-local';
const {knex} = require('../util/database').connect();
import crypto from 'crypto';
require('../init-env-variables');

const localOptions = {
  usernameField: 'username'
};
const localLogin = new LocalStrategy(localOptions, (username, password, done) => {
  return knex('admin').where('username', username).first()
  .then(row => {
    if (_.isEmpty(row)) {
      return done(null, false)
    }
    const pw = row.password
    if (pw != crypto.createHash('md5').update(password).digest("hex")) {
      return done(null, false);
    }
    return done(null, true)
  });
});

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.JWT_SECRET
};

const jwtLogin = new Strategy(jwtOptions, (payload, done) => {
  return knex('admin').select('username').where('id', payload.sub)
  .then(rows => {
    if (_.isEmpty(rows)) {
      return done(null, false)
    }
    const startTime = moment(payload.iat)
    const nowTime = moment(new Date().getTime())
    const timeSpent = nowTime.diff(startTime, 'hours')
    if (timeSpent > 24) {
      return done(null, false)
    } else {
      const id = payload.sub;
      return done(null, id)
    }
  });
});

passport.use(jwtLogin);
passport.use(localLogin);
