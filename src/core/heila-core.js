import _ from 'lodash';
import { prefixImageWithGCS } from './image-core.js'
import { GCS_CONFIG } from '../util/gcs';
import * as functionCore from './function-core.js';
const {knex} = require('../util/database').connect();

function createOrUpdateHeila(heila) {
  return _findUserIdByUuid(heila.uuid)
    .then(userId => {
      heila['userId'] = userId;
      return findByUuid(heila.uuid)
      .then(foundHeila => {
        if (foundHeila === null) {
          return createHeila(heila);
        } else {
          return updateHeila(heila);
        }
      })
      .then(rows => {
        // this is a side-effect but a good tradeoff:
        // when someone makes changes to the profile's
        // heila row, let's automatically make sure that
        // the heila field is true in users table
        // this field is set to false when the profile
        // is removed from the service
        // this saves the client from doing multiple requests
        // for simply updating/creating or deleting a profile
        // --> this way the user's heila field completely
        // depends on the status of his/her profile
        return knex('users')
          .where('uuid', heila.uuid)
          .update({ 'heila': true })
          .then(rows => undefined)
      });
    })
}

// creates a row in the heilas table
function createHeila(heila) {
  const dbRow = _makeHeilaDbRow(heila);
  return knex('heilas').returning('userId').insert(dbRow)
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('Heila row creation failed: ' + dbRow);
      }
      if (heila.push_token) {
        // this adds the push_token to Firebase database
        // so that the "send push message to user" function
        // triggered by new chat msg write can use the push_token immediately
        functionCore.addPushNotificationTokenForUserId(heila.userId, heila.push_token);
      }
      return rows.length;
    });
}

function updateHeila(heila) {
  const dbRow = _makeHeilaDbRow(heila);
  return knex('heilas').returning('userId').update(dbRow)
    .where('uuid', heila.uuid)
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('Heila row update failed: ' + dbRow);
      }

      if (heila.push_token) {
        // this adds the push_token to Firebase database
        // so that the "send push message to user" function
        // triggered by new chat msg write can use the push_token immediately
        functionCore.addPushNotificationTokenForUserId(heila.userId, heila.push_token);
      }
      return rows;
    })
}

function _findUserIdByUuid(uuid) {
  return knex('users')
    .select('users.*')
    .where({ uuid: uuid })
    .then(rows => {
      return rows[0].id;
    })
}

function findByUuid(uuid) {
  return knex('heilas')
    .select(
      'heilas.*'
    )
    .where({ uuid: uuid })
    .then(rows => {
      if (_.isEmpty(rows)) {
        return null;
      }

      return _heilaRowToObject(rows[0]);
    });
}

// returns a customized heila list; this means that
// the profiles that have already been UPed or DOWNed
// have been filtered out --> returns only "fresh" profiles
function getAllHeilas(uuid) {
  
  return getHeilaByUuid(uuid)
    .then(myProfile => {
      // my profile is now an object holding the requestors profile
      return knex('heilas')
        .join('users', 'heilas.userId', 'users.id')
        .then(rows => {
          if (_.isEmpty(rows)) {
            return [];
          }
          
          const userId = parseInt(myProfile.id); // TODO
          // this is now a list of all profiles EXCEPT the requestors own profile
          const unfilteredHeilalist = _heilaRowsToObjectList(rows).filter(h => h.id != userId);

          // get all matches where this particular user is involved
          return knex('matches')
            .select('matches.*')
            .where({ 'userId1': userId })
            .orWhere({ 'userId2': userId })
            .then(previousMatches => {
               
              const myPreviousMatches = previousMatches.filter(elem => {
                if (elem.userId1 === userId) {
                  return !!elem.opinion1;
                } else {
                  return !!elem.opinion2;
                }
              });

              const filterOutIds = myPreviousMatches.map(match => match.userId1 === userId ? match.userId2 : match.userId1);

              const filtered = unfilteredHeilalist.filter(elem => {
                return filterOutIds.indexOf(parseInt(elem.id)) === -1;
              });

              const sameTypes = [];
              const otherTypes = [];
              const myType = myProfile.bio_looking_for_type_id;

              filtered.forEach(heila => {
                if (heila.bio_looking_for_type_id === myType) {
                  sameTypes.push(heila);
                } else {
                  otherTypes.push(heila);
                }
              });
              return sameTypes.concat(otherTypes);
            })
        })
  })
}

// this is used for requesting details about a single profile
function getHeilaByUserId(userId) {
  return knex('users')
    .join('heilas', 'users.id', 'heilas.userId')
    .where({ 'users.id': userId })
    .then(rows => {
      if (_.isEmpty(rows)) {
        return [];
      }
      return _heilaRowsToObjectList(rows)[0];
    })
}

// this is used for requesting details about your OWN profile
function getHeilaByUuid(uuid) {
  return knex('users')
    .join('heilas', 'users.id', 'heilas.userId')
    .where({ 'users.uuid': uuid })
    .then(rows => {
      if (_.isEmpty(rows)) {
        return [];
      }
      return _heilaRowsToObjectList(rows)[0];
    })
}

function _mergeUserHeilaRows(userRows, heilaRows) {
  // merge users and heilas
  // return a list of objects including all fields
  userRows.forEach(user => {
    for (let i = 0; i < heilaRows.length; i += 1) {
      if (user.uuid === heilaRows[i].uuid) {
        user = Object.assign(user, heilaRows[i]);
        break;
      }
    }
  })
  return userRows;
}

function _heilaRowsToObjectList(userList) {

  // userList only inlcludes profiles where heila field is true
  const heilaList = userList
    .map(user => {
      return {
        id: user.id,
        name: user.name,
        team_id: user.team_id,
        image_url: user.image_path ? prefixImageWithGCS(user.image_path) : null,
        bio_text: user.bio_text,
        bio_looking_for_type_id: user.bio_looking_for_type_id,
        class_year: user.class_year,
      }
    })
  return heilaList;
}

function _makeHeilaDbRow(heila) {
  const dbRow = {
    'userId': heila.userId,
    'uuid': heila.uuid,
    'bio_text': heila.bio_text,
    'bio_looking_for_type_id': heila.bio_looking_for_type_id,
    'push_token': heila.push_token,
    'class_year': heila.class_year,
  };
  return dbRow;
}

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
function _heilaRowToObject(row) {
  // if no image has been uploaded, return an empty string
  let url = null;
  if (row.image_path) {
    url = `${GCS_CONFIG.baseUrl}/${GCS_CONFIG.bucketName}/${row.image_path}`;
  }

  return {
    id: row.userId,
    uuid: row.uuid,
    // this is a URL that points to GCS, the db only stores the path to that
    image_url: url,
    bio_text: row.bio_text,
    bio_looking_for_type_id: row.bio_looking_for_type_id,
    class_year: row.class_year,
  };
}

function getHeilaTypes() {
  return knex('heila_types')
    .select('heila_types.*')
    .then(rows => {
      return rows;
    });
};

function deleteHeila(uuid) {
  // first drops the row from heilas table
  // then toggles the true/false of users table
  // for this uuid
  // this IS a side-effect if you think about it
  // from the users table's perspective, yes.
  return knex('heilas')
    .where({ 'uuid': uuid })
    .del()
    .then(res => {
      // TODO: could this Promise Hell be somehow improved?!
      return knex('users')
        .where({ 'uuid': uuid })
        .update({ 'heila': false })
        .then(rows => {
          return _findUserIdByUuid(uuid)
            .then(userId => {
              return functionCore.removeUserId(userId);
            })
        });
    });
};

function addHeilaReport(report) {

  // just insert the row to the db
  // --> there's no automatic notification or whatever
  // so Futurice folks has to query the db
  // TODO: how to get updates from these etc.
  return knex('heila_reports').insert(report)
    .then(rows => {
      console.log(rows);
    });
};

function handleReadReceipt(receipt) {
  // console.log('handleReadReceipt');
  return findByUuid(receipt.uuid)
    .then(rows => {
      functionCore.markRead({ userId: rows.userId, type: receipt.type });
    });
};

export {
  createOrUpdateHeila,
  findByUuid,
  getAllHeilas,
  getHeilaByUserId,
  getHeilaByUuid,
  getHeilaTypes,
  deleteHeila,
  addHeilaReport,
  handleReadReceipt,
};
