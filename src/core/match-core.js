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

// matches are stored in a table named matches that looks like this:
//
// id | userId1 | userId2 | opinion1 | opinion2 |    firebaseChatId
// ----+---------+---------+----------+----------+----------------------
// 2 |       3 |      66 | UP       |          |
// 3 |       2 |       3 | UP       | UP       | -L1qIL_JuJnSTuKJxgmO
//
// NOTE: userId1 is ALWAYS the smaller userId of the two userIds,
// returned from simple < comparison
//
// NOTE: by default opinion1 and opinion2 and firebaseChatId are empty/null
//
// How createOrUpdateMatch works:
//
// 1. check if there's a row matching received matchobject (userid1, userid2 match)
// 2. if no match, then insert a row
// 3. if match, then update the row
// 4. check if both opinions are UP
// 5. if both UP, check if they already have a firebaseChatId
// 6. if no firebaseCahtId, -> request a new chatId from firebase functions
// 7. if new chat was created, save the chatId to the db

function createOrUpdateMatch(match) {
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
      matchObject['opinion1'] = match.opinion;
      currentUserString = '1';
    } else {
      matchObject['opinion2'] = match.opinion;
      currentUserString = '2';
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
            // console.log('opinion changed or missing --> update with this matchObject:');
            // console.log(matchObject);
            return knex('matches')
              .returning('id')
              .where({ 'userId1': matchObject.userId1,
                       'userId2': matchObject.userId2 })
              .update(matchObject)
              .then(updatedRows => {
                const otherUserString = currentUserString === '1' ? '2' : '1';
                const otherUserOpinion = earlierRow['opinion' + otherUserString];
                // console.log('currentUserString: ' + currentUserString);
                // console.log('currentUserOpinion: ' + match.opinion);
                // console.log('oterUserString: ' + otherUserString);
                // console.log('oterUserOpinion: ' + otherUserOpinion);
                if (match.opinion === 'UP' && otherUserOpinion === 'UP') {
                  // console.log('both users have UP');
                  // if the row ALREADY has firebaseChatId then the two users
                  // already have a chat in Firebase -> no need to create a new one
                  // this could happen if one first UPs, then the other UPs, then
                  // either DOWNs and UPs again
                  if (!earlierRow['firebaseChatId']) {
                    return handleMatch(matchObject);
                  }
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
      matchObject['firebaseChatId'] = chatFirebaseKey;
      return knex('matches')
        .returning('id')
        .where({ 'userId1': matchObject.userId1,
                 'userId2': matchObject.userId2 })
        .update(matchObject)
        .then(rows => {
          return functionCore.sendMatchNotification(matchObject.userId1, matchObject.userId2);
        });
    })
}

function getListOfMatches(uuid) {
  return _uuidToUserId(uuid)
    .then(userId => {
      return knex('matches')
        .select('matches.*')
        .where('userId1', userId)
        .orWhere('userId2', userId)
        .then(rows => {
          rows = rows.filter(row => {
            return row.opinion1 === 'UP' &&
                   row.opinion2 === 'UP' &&
                   row.firebaseChatId;
          });
          return rows;
        })
    })
};

function closeMatch(close) {

  return _uuidToUserId(close.uuid)
    .then(closerUserId => {
      // """security check"""
      return knex('matches')
        .select('matches.*')
        .where({
          'userId1': closerUserId < close.matchedUserId ? closerUserId : close.matchedUserId,
          'userId2': closerUserId < close.matchedUserId ? close.matchedUserId : closerUserId,
          'firebaseChatId': close.firebaseChatId
        })
        .then(rows => {
          if (rows.length === 1) {
            // this will close the chat via Firebase function
            functionCore.closeChat(close.firebaseChatId);
          }
        })
    })
};

export {
  createOrUpdateMatch,
  getListOfMatches,
  closeMatch,
}
