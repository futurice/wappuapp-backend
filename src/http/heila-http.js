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

const getHeilaList = createJsonRoute(function(req, res) {
  const userId = req.query.userId;

  // if there's a query param for userId, then return only that
  if (userId) {
    console.log('get single heila details by userId' + userId);
    return heilaCore.getHeilaByUserId(userId)
    .then(heila => {
      if (heila === null) {
        const err = new Error('Heila not found: ' + userId);
        err.status = 404;
        throw err;
      }
      return heila;
    });
  } else {
    // otherwise return all heila profiles wuhuu
    return heilaCore.getAllHeilas()
      .then(heilaList => {
        return heilaList;
      })
  }
});

export {
  putHeila,
  getHeilaList
};
