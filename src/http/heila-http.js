import * as userCore from '../core/user-core';
import * as heilaCore from '../core/heila-core';
import {createJsonRoute} from '../util/express';
import {assert} from '../validation';

const putHeila = createJsonRoute(function(req, res) {
  console.log('putHeila');
  const heila = assert(req.body, 'heila');
  console.log(heila);

  return heilaCore.createOrUpdateHeila(heila)
    .then(rowsInserted => undefined);
});

// TODO: ei futaa
const getHeilas = createJsonRoute(function(req, res) {
  console.log('getHeilas FIX ME')
  return new Promise();
});


const getHeilaByUuid = createJsonRoute(function(req, res) {
  return heilaCore.findByUuid(req.params.uuid)
  .then(heila => {
    if (heila === null) {
      const err = new Error('Heila not found: ' + req.params.uuid);
      err.status = 404;
      throw err;
    }

    return heila;
  });
});



// TODO: onko tarve
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
  putHeila,
  getHeilas,
  getHeilaByUuid,
};
