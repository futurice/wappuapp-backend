import _ from 'lodash';
import * as voteCore from '../core/vote-core';
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';

let putVote = createJsonRoute(function(req, res) {
  if (!req.client.id) {
    throwStatus(403);
  }

  const vote = assert({
    value: req.body.value,
    feedItemId: req.body.feedItemId,
  }, 'vote');

  return voteCore.createOrUpdateVote(_.merge(vote, { client: req.client, ip: req.ip }));
});

export {
  putVote
};
