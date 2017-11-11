import _ from 'lodash';
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';
import * as passportService from '../util/passport';
import jwt from 'jwt-simple';
import passport from 'passport';
import crypto from 'crypto';
const {knex} = require('../util/database').connect();

function tokenForUser(id) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: id, iat: timestamp }, "SECRET");
};

const login = createJsonRoute(function(req, res) {
  return knex('admin').select('id').where('username', req.body.username).first()
    .then(id => {
      return { token: tokenForUser(id.id) };
    })
});

const register = createJsonRoute(function(req, res, next) {
  const username = req.body.username;
  const email = req.body.email;
  const password = crypto.createHash('md5').update(req.body.password).digest("hex");
  if (!username || !email || !password) {
    return throwStatus(400, 'All fields must be provided');
  }
  return knex('admin').select('id').where('username', username)
  .then(rows => {
    if (_.isEmpty(rows)) {
      return knex('admin').select('id').where('email', email)
      .then(rows => {
        if (_.isEmpty(rows)) {
          return knex('admin').insert({ username: username, email: email, password: password })
          .then(result => {
            return knex('admin').select('id').where('username', username).first()
            .then(result => {
              const id = result.id;
              return { token: tokenForUser(id) };
            })
          })
        } else {
          return throwStatus(422, 'Email exists');
        }
      })
    } else {
      return throwStatus(422, 'Username exists');
    }
  });
});

export {
  login,
  register
};
