import { createJsonRoute } from '../util/express';
import {assert} from '../validation';
import * as matchesCore from '../core/match-core';

// this gives a list of matches between user and other users
const getUsersMatchesList = createJsonRoute(function(req, res) {
  console.log(req.params)
  const user = assert(req.params, 'matchesList');
  return matchesCore.getListOfMatches(user.uuid)
    .then(matchesList => {
      console.log('matchesList received in matches-http');
      console.log(matchesList);
      return matchesList;
    });
});

const getChat = createJsonRoute(function(req, res) {
});

// this is used when a user presses the thumbs UP/DOWN
const postMatch = createJsonRoute(function(req, res) {
  const match = assert(req.body, 'match');

  return matchesCore.createOrUpdateMatch(match)
    .then(rows => undefined)
})

export {
  getUsersMatchesList,
  getChat,
  postMatch
}
