import _ from 'lodash';
import * as feedCore from '../core/login-core';
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';
import * from '../util/passport';
import jwt from 'jwt-simple';
import passport from 'passport';
const {knex} = require('../util/database').connect();

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, "SECRET");
};

const login = createJsonRoute(function(req, res) {
  res.send({ token: tokenForUser(req.user) });
};

const logout = createJsonRoute(function(req, res) {
  req.logout();
  res.redirect('/');
};

const register = createJsonRoute(function(req, res, next) {
  const username = req.body.username;
  const email = req.body.email;
  const password = crypto.createHash('md5').update(req.body.password).digest("hex"));
  if (!username || !email || !password) {
    return res.status(422).send({ error: 'All fields must be provided' });
  }
  let sqlString `
  (SELECT users.username FROM users WHERE users.username == ${username})
  `
  return knex.raw(sqlString)
  .then(result => {
    const rows = result.rows;
    if (_.isEmpty(rows)) {
      sqlString = `
      (INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${password}))
      `;
      knex.raw(sqlString)
      return res.json({ token: tokenForUser(user) });
    } else {
      return res.status(422).send({ error: 'Username exists' });
    }
};

export {
  login,
  logout,
  register
};
