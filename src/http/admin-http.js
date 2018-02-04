import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';
import * as adminCore from '../core/admin-core';
import _ from 'lodash';

const deleteFeedItem = createJsonRoute(function(req, res) {
  const id = assert(req.params.id, 'common.primaryKeyId');

//Same as in feed-http.js, except this doesn't use opts.uuid parameter
  return adminCore.deleteFeedItem(id)
  .then(deletedCount => {
    if (deletedCount === 0) {
      // NOTE: deletedCount === 0, might also mean "forbidden" because the uuid
      // restriction is done in the SQL
      // In both cases, we just inform the user with Not Found
      return throwStatus(404, 'Not Found');
    } else {
      // Return 200 OK
      return undefined;
    }
  });
});

const shadowBanUser = createJsonRoute(function(req, res) {
  const id = assert(req.params.id, 'common.primaryKeyId');

  return adminCore.shadowBanUser(id)
  .then(updatedCount => {
    if (updatedCount === 0) {
      return throwStatus(404, 'User not found');
    } else {
      return undefined;
    }
  });
});

const unBanUser = createJsonRoute(function(req, res) {
  const id = assert(req.params.id, 'common.primaryKeyId');

  return adminCore.unBanUser(id)
  .then(updatedCount => {
    if (updatedCount === 0) {
      return throwStatus(404, 'User not found');
    } else {
      return undefined;
    }
  });
});

let sendSystemMessage = createJsonRoute(function(req, res){
  let action = assert(_.merge(req.body, {
    city: req.body.cityId,
  }), 'action');

  if (_.isString(action.text) && action.text.trim().length === 0) {
    throwStatus(400, 'Text cannot be empty.');
  }

  if (action.client == undefined){
    action.client = req.client;
  }

  if (action.type !== 'TEXT'){
    throwStatus(400, `SystemMessage type must be text`)
  }

  return adminCore.sendSystemMessage(action)
});

export {
  deleteFeedItem,
  shadowBanUser,
  unBanUser,
  sendSystemMessage
}
