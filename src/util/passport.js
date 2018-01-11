import _ from 'lodash';
import passport from 'passport';
import moment from 'moment';
import {Strategy, ExtractJwt} from 'passport-jwt';
import LocalStrategy from 'passport-local';
const {knex} = require('../util/database').connect();
import crypto from 'crypto';
require('../init-env-variables');

const localOptions = {
  usernameField: 'email'
};
const localLogin = new LocalStrategy(localOptions, (email, password, done) => {
  const cipher = crypto.createCipher('aes192', process.env.CRYPTO_PASSWORD);
  email = cipher.update(email, 'utf8', 'hex');
  email += cipher.final('hex');
  return knex('role').select('activated').where('email', email)
  .then(rows => {
    if (_.isEmpty(rows)) {
      return done(null, false)
    }
    const [activated] = rows;
    if (activated.activated != true) {
      return done(null, false)
    }
    return knex('role').where('email', email).first()
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
});

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.JWT_SECRET
};

const jwtLogin = new Strategy(jwtOptions, (payload, done, req) => {
  const uuid = req.headers['x-user-uuid'];
  return knex('users').select('id').where('uuid', uuid)
    .then(rows => {
      if (_.isEmpty(rows)) {
        return knex('role').select('email').where('id', payload.sub)
        .then(row => {
          if (_.isEmpty(row)) {
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
      } else {
        const [row] = rows
        if (row.role != null) {
          return done(null, true)
        } else {
          return done(null, false)
        }
      }
    })
});

const adminLogin = new Strategy(jwtOptions, (payload, done, request) => {
  return knex('role').select('admin').where('id', payload.sub)
  .then(row => {
    if (_.isEmpty(row)) {
      return done(null, false)
    }
    const [admin] = row
    if (admin.admin != true) {
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
passport.use('admin', adminLogin);
passport.use(localLogin);
