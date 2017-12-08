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

const addmoderator = createJsonRoute(function(req, res, next) {
  const username = req.body.username;
  const email = req.body.email;
  const password = crypto.createHash('md5').update(req.body.password).digest("hex");
  if (!username || !email || !password) {
    return throwStatus(400, 'All fields must be provided');
  }
  return knex('admin').select('id').where('username', username).orWhere('email', email)
  .then(rows => {
    if (_.isEmpty(rows)) {
      return knex('admin').insert({ username: username, email: email, password: password }).returning('id')
      .then(result => {
        const [id] = result;
        return { token: tokenForUser(id) };
      })
    } else {
      return throwStatus(422, 'User with the given email or username already exists');
    }
  });
});

const changepw = createJsonRoute(function(req, res, next) {
  //TODO
};

const forgottenpw = createJsonRoute(function(req, res, next) {
  //TODO
};

const promote = createJsonRoute(function(req, res, next) {
  email = req.params.email;
  return knex('admin').where('email', email).update({admin: true}).returning('id')
  .then(row => {
    if (_.isEmpty(row)) {
      return throwStatus(404, 'Moderator with given email does not exist');
    } else {
      return throwStatus(200, 'User promoted to admin');
    }
  });
};

const demote = createJsonRoute(function(req, res, next) {
  email = req.params.email;
  return knex('admin').where('email', email).update({admin: false}).returning('id')
  .then(row => {
    if (_.isEmpty(row)) {
      return throwStatus(404, 'Moderator with given email does not exist');
    } else {
      return throwStatus(200, 'User demoted to moderator');
    }
  });
};

export {
  promote,
  demote,
  changepw,
  forgottenpw,
  login,
  addmoderator
};
