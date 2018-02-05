import * as heilaCore from '../core/heila-core';
import {throwStatus, createJsonRoute} from '../util/express';
import {assert} from '../validation';

const deleteHeila = createJsonRoute(function(req, res) {
  const uuid = req.params.uuid;
  console.log('deleteHeila ' + uuid);
  return heilaCore.deleteHeila(uuid)
    .then(rowsInserted => undefined)
    .catch(err => {
      console.log('error happened while deleteHeila was called');
      console.log(err);
      throwStatus(500, 'Something went wrong.');
    })
});

const putHeila = createJsonRoute(function(req, res) {
  console.log('putHeila');
  const heila = assert(req.body, 'heila');
  console.log(heila);

  return heilaCore.createOrUpdateHeila(heila)
    .then(rowsInserted => {
      if (rowsInserted === -1) {
        throwStatus(500, 'Something went wrong.');
      }
    });
});

const getHeilaList = createJsonRoute(function(req, res) {
  const userId = req.query.userId;
  const uuid = req.params.uuid;

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
    return heilaCore.getAllHeilas(uuid)
      .then(heilaList => {
        return heilaList;
      })
  }
});

const getHeilaTypes = createJsonRoute(function(req, res) {
  // if there's a query param for userId, then return only that
  return heilaCore.getHeilaTypes()
    .then(list => {
      return list;
    });
});

const postHeilaReport = createJsonRoute(function(req, res) {
  console.log('postHeilaReport');
  const report = assert(req.body, 'heila_report');
  console.log(report);

  return heilaCore.addHeilaReport(report)
    .then(rowsInserted => {
      if (rowsInserted === -1) {
        throwStatus(500, 'Something went wrong.');
      }
    });
});

const postPushNotificationReceipt = createJsonRoute(function(req, res) {
  console.log('postPushNotificationReceipt');
  const receipt = assert(req.body, 'heila_push_receipt');
  console.log(receipt);

  return heilaCore.handleReadReceipt(receipt)
    .then(rowsInserted => {
      if (rowsInserted === -1) {
        throwStatus(500, 'Something went wrong.');
      }
    });
});

export {
  putHeila,
  getHeilaList,
  getHeilaTypes,
  deleteHeila,
  postHeilaReport,
  postPushNotificationReceipt,
};
