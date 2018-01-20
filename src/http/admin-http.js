import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';
import * as adminCore from '../core/admin-core';
import _ from 'lodash';
import * as throttleCore from '../core/throttle-core';

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

const sendSystemMessage = createJsonRoute(function (req, res){
  const action = assert(_.merge(req.body, {
    city: req.query.cityId,
  }), 'action');

  if (_.isString(action.text) && action.text.trim().length === 0) {
    throwStatus(400, 'Text cannot be empty.');
  }

  if (!req.client.id) {
    throwStatus(403);
  }

  //let handleAction;

  action.ip = req.ip;

  //handleAction = actionCore.getActionType(action.type)

  if (!action.type === 'text') {
      throwStatus(400, 'Action type must be text');
    } else {
      return Promise.resolve();
    }
  return adminCore.sendSystemMessage(_.merge(action, {client: req.client}))
  .then(() => throttleCore.executeAction(action.user, action.type))
  .then(() => undefined);

  //return adminCore.sendSystemMessage(action)
});

export {
  deleteFeedItem,
  shadowBanUser,
  unBanUser,
  sendSystemMessage
}
