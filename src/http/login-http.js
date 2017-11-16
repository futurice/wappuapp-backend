import _ from 'lodash';
import {createJsonRoute, throwStatus} from '../util/express';

import jwt from 'jwt-simple';
import crypto from 'crypto';
const {knex} = require('../util/database').connect();
require('../init-env-variables');

function tokenForUser(id) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: id, iat: timestamp }, process.env.JWT_SECRET);
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
  return knex('admin').select('id').where('username', username).orWhere('email', email)
  .then(rows => {
    if (_.isEmpty(rows)) {
      return knex('admin').insert({ username: username, email: email, password: password }).first()
      .then(result => {
        const id = result.id;
        return { token: tokenForUser(id) };
      })
    } else {
      return throwStatus(422, 'User with the given email or username already exists');
    }
  });
});

export {
  login,
  register
};
