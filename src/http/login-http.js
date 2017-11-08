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
  return { token: tokenForUser(req.user) };
});

const register = createJsonRoute(function(req, res, next) {
  const username = req.body.username;
  const email = req.body.email;
  const password = crypto.createHash('md5').update(req.body.password).digest("hex");
  if (!username || !email || !password) {
    return throwStatus(400, 'All fields must be provided');
  }
  let sqlString = `
  (SELECT admin.id FROM admin WHERE admin.username = '${username}');
  `;
  return knex.raw(sqlString)
  .then(result => {
    const rows = result.rows;
    if (_.isEmpty(rows)) {
      let sqlString = `
      INSERT INTO admin (username, email, password) VALUES ('${username}', '${email}', '${password}');
      `;
      return knex.raw(sqlString)
      .then(result => {
        let sqlString = `
        (SELECT admin.id FROM admin WHERE admin.username = '${username}')
        `
        return knex.raw(sqlString)
        .then(result => {
          const id = result.rows[0].id;
          return { token: tokenForUser({id: id}) };
        })
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
