const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();


function _uuidToUserId(uuid) {
  return knex('users')
    .where({ uuid: match.uuid })
    .then(rows => {
      const user = rows[0];
      return user.id;
    })
}

function updateMatch(match) {
  console.log('updateMatch')
  console.log(match)

  // this retrieves the userId of the matching user
  _uuidToUserId(match.uuid)
  .then(userId => {
    match['fromUserId'] = userId;

    // this retrieves a row where from and to are the same
    return knex('matches')
      .where('from', match.fromUserId)
      .where('to', match.matchedUserId)
      .then(rows => {
        const newRow = _makeMatchDbRow(match);
        // no match from this userId to that userId
        // --> add a row from this to that with opinion
        if (rows.length === 0) {
          return knex('matches')
            .insert(newRow)
            .then(result => {
              console.log('result');
              console.log(result);
            });
        } else {
          // there was a row from this to that already
          const earlierMatchObject = rows[0];
          console.log(earlierMatchObject);

          // if the opinion has changed, lets change it
          if (earlierMatchObject.opinion !== match.opinion) {
            return knex('matches')
              .returning('id')
              .where({ from: match.fromUserId,
                       to: match.matchedUserId })
              .update(newRow)
              .then(updatedRows => undefined);
          }
        }
      })
    
    // TODO: check if there's a two-way match --> open a chat

    })
}

function _makeMatchDbRow(match) {

  const dbRow = {
    'from': match.fromUserId,
    'to': match.matchedUserId,
    'opinion': match.opinion,
  }
  return dbRow;
}

export {
  updateMatch
}
