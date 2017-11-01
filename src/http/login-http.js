import _ from 'lodash';
import * as feedCore from '../core/login-core';
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';
import * from '../util/passport';
import jwt from 'jwt-simple';

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, "SECRET");
};

const login = createJsonRoute(function(req, res) {
  res.send({ token: tokenForUser(req.user)});
};

const logout = createJsonRoute(function(req, res) {
};

const register = createJsonRoute(function(req, res) {
};

export {
  login,
  logout,
  register
};
