import { createJsonRoute } from '../util/express';
import {assert} from '../validation';
import * as matchesCore from '../core/match-core';

// this gives a list of matches between user and other users
const getMatches = createJsonRoute(function(req, res) {
  console.log(req.params)
  const user = assert(req.params, 'matchesList');
  return matchesCore.getListOfMatches(user.uuid)
    .then(matchesList => {
      console.log('matchesList received in matches-http');
      console.log(matchesList);
      return matchesList;
    });
});

// this is used when a user presses the thumbs UP/DOWN
const postMatch = createJsonRoute(function(req, res) {
  const match = assert(req.body, 'match');

  return matchesCore.createOrUpdateMatch(match)
    .then(rows => undefined)
})

// this is used when a user closes a chat between another user
const postMatchClose = createJsonRoute(function(req, res) {
  const close = assert(req.body, 'matchClose');

  return matchesCore.closeMatch(close)
    .then(rows => undefined)
})

export {
  getMatches,
  postMatch,
  postMatchClose
}
