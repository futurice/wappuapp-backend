import { createJsonRoute } from '../util/express';
import {assert} from '../validation';
import * as matchesCore from '../core/matches-core';

// this gives a list of matches between user and other users
const getMatches = createJsonRoute(function(req, res) {
});

const getChat = createJsonRoute(function(req, res) {
});

// this is used when a user presses the thumbs UP/DOWN
const postMatch = createJsonRoute(function(req, res) {
  const match = assert(req.body, 'match');

  return matchesCore.updateMatch(match)
    .then(rows => undefined)
})

export {
  getMatches,
  getChat,
  postMatch
}
