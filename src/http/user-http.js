import * as userCore from '../core/user-core';
import {createJsonRoute} from '../util/express';
import {assert} from '../validation';

const putUser = createJsonRoute(function(req, res) {
  const user = assert(req.body, 'user');

  return userCore.createOrUpdateUser(user)
    .then(rowsInserted => undefined);
});

const putUserImage = createJsonRoute(function(req, res) {
  const user = assert(req.body, 'userImage');

  return userCore.createOrUpdateUser(user)
    .then(rowsInserted => undefined);
});

const getUserByUuid = createJsonRoute(function(req, res) {
  return userCore.findByUuid(req.params.uuid)
  .then(user => {
    if (user === null) {
      const err = new Error('User not found: ' + req.params.uuid);
      err.status = 404;
      throw err;
    }

    return user;
  });
});

const getUserById = createJsonRoute(function(req, res) {
  const userParams = assert(req.query, 'userQueryParams');

  const coreParams = Object.assign(userParams, {
    client: req.client,
  });

  return userCore.getUserDetails(coreParams)
    .then(user => {
      if (user === null) {
        const err = new Error('User not found: ' + req.query.userId);
        err.status = 404;
        throw err;
      }

      return user;
    });
});

export {
  putUser,
  putUserImage,
  getUserByUuid,
  getUserById
};
