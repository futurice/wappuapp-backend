const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();

import * as functionCore from './function-core';

function _uuidToUserId(uuid) {
  return knex('users')
    .select('users.*')
    .where({ uuid: uuid })
    .then(rows => {
      const user = rows[0];
      return user.id;
    })
}

function createOrUpdateMatch(match) {
  console.log('updateMatch')
  console.log(match)

  // this retrieves the userId of the matching user
  return _uuidToUserId(match.uuid)
  .then(userId => {

    userId = parseInt(userId);
    match['fromUserId'] = userId;
    match.matchedUserId = parseInt(match.matchedUserId);

    if (userId === match.matchedUserId) {
      throw new Error('Cannot match your own userId!');
    }

    const matchObject = {
      'userId1': '',
      'userId2': ''
    };

    if (match.fromUserId < match.matchedUserId) {
      matchObject.userId1 = match.fromUserId;
      matchObject.userId2 = match.matchedUserId;
    } else {
      matchObject.userId2 = match.fromUserId;
      matchObject.userId1 = match.matchedUserId;
    }

    let currentUserString;
    if (matchObject.userId1 === match.fromUserId) {
      matchObject["opinion1"] = match.opinion;
      currentUserString = "1";
    } else {
      matchObject["opinion2"] = match.opinion;
      currentUserString = "2";
    }

    // this retrieves a row where from and to are the same
    return knex('matches')
      .where({ 'userId1': matchObject.userId1,
               'userId2': matchObject.userId2 })
      .then(rows => {
        if (rows.length === 0) {
          return knex('matches')
            .insert(matchObject)
            .then(result => {
              console.log('matchRow added');
            });
        } else {
          const earlierRow = rows[0];
          // check if the row in DB already has this user's new opinion
          if (earlierRow['opinion' + currentUserString] !== match.opinion) {
            console.log('opinion changed or missing --> update with this matchObject:');
            console.log(matchObject);
            return knex('matches')
              .returning('id')
              .where({ 'userId1': matchObject.userId1,
                       'userId2': matchObject.userId2 })
              .update(matchObject)
              .then(updatedRows => {
                const otherUserString = currentUserString === '1' ? '2' : '1';
                const otherUserOpinion = earlierRow['opinion' + otherUserString];
                console.log('currentUserString: ' + currentUserString);
                console.log('currentUserOpinion: ' + match.opinion);
                console.log('oterUserString: ' + otherUserString);
                console.log('oterUserOpinion: ' + otherUserOpinion);
                if (match.opinion === 'UP' && otherUserOpinion === 'UP') {
                  console.log('both users have UP');
                  return handleMatch(matchObject);
                }
              })
          }
        }
      })
    })
}

function handleMatch(matchObject) {
  // now what needs to be done:
  // 1. create a new chat in Firebase
  // 2. save the chat key in db
  return functionCore.createChatForTwoUsers(matchObject)
    .then(chatFirebaseKey => {
      console.log('chatFirebaseKey')
      console.log(chatFirebaseKey)
      matchObject['firebaseChatId'] = chatFirebaseKey;
      return knex('matches')
        .returning('id')
        .where({ 'userId1': matchObject.userId1,
                 'userId2': matchObject.userId2 })
        .update(matchObject)
    })
}

function faveFirebaseKey(chatFirebaseKey) {
 //
}

export {
  createOrUpdateMatch
}
