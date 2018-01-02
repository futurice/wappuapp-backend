const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();


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

              if (match.opinion === 'UP') {
                return checkIfMatchWasFound(newRow);
              }

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
              .then(updatedRows => {
                if (match.opinion === 'UP') {
                  return checkIfMatchWasFound(newRow);
                }
              })
          }
        }
      })
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

function checkIfMatchWasFound(matchDbRow) {
  console.log('checkIfMatchWasFound')
  console.log(matchDbRow)

  return knex('matches')
    .select('matches.*')
    .where({ 'from': matchDbRow.to,
             'to': matchDbRow.from })
    .then(rows => {
      if (rows.length === 1) {
        
        // match is 2-way
        console.log('MATCH WAS FOUND!½!!!!!')
        
        // now what needs to be done:
        // 1. create a new chat in Firebase
        // 2. save the chat key in db
        // 3. ...
      }
    })
}

export {
  createOrUpdateMatch
}
