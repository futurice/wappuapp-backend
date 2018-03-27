import _ from 'lodash';
import * as actionCore from '../core/action-core';
import { createJsonRoute, throwStatus } from '../util/express';
import { assert } from '../validation';
import * as imageHttp from './image-http';
import * as eventHttp from './event-http';
import * as throttleCore from '../core/throttle-core';
import * as commentCore from '../core/comment-core';

let postAction = createJsonRoute(function(req, res) {
  const action = assert(
    _.merge(req.body, {
      city: req.query.cityId,
    }),
    'action'
  );

  if (_.isString(action.text) && action.text.trim().length === 0) {
    throwStatus(400, 'Text cannot be empty.');
  }

  if (!req.client.id) {
    throwStatus(403);
  }

  return throttleCore.canDoAction(action.user, action.type).then(canDoAction => {
    if (!canDoAction) {
      throwStatus(429, `Too many actions of type ${action.type}`);
    }

    let handleAction;
    if (action.type === 'IMAGE') {
      handleAction = imageHttp.postImage(req, res, action);
    } else if (action.type === 'COMMENT') {
      handleAction = commentCore.newComment(_.merge(action, { client: req.client }));
    } else {
      action.ip = req.ip;
      action.isBanned = req.client.isBanned;

      handleAction = actionCore
        .getActionType(action.type)
        .then(type => {
          if (type === null) {
            throwStatus(400, 'Action type ' + action.type + ' does not exist');
          } else if (type.code === 'CHECK_IN_EVENT') {
            return eventHttp.isValidCheckIn(action);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => actionCore.createAction(_.merge(action, { client: req.client })));
    }

    return handleAction
      .then(() => throttleCore.executeAction(action.user, action.type))
      .then(() => undefined);
  });
});

export { postAction };
