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
      if (heila.pushToken) {
        // this adds the pushToken to Firebase database
        // so that the "send push message to user" function
        // triggered by new chat msg write can use the pushToken immediately
        functionCore.addPushNotificationTokenForUserId(heila.userId, heila.pushToken);
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

      if (heila.pushToken) {
        // this adds the pushToken to Firebase database
        // so that the "send push message to user" function
        // triggered by new chat msg write can use the pushToken immediately
        functionCore.addPushNotificationTokenForUserId(heila.userId, heila.pushToken);
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

function getAllHeilas(uuid) {

  // returns a list of objects like this
  // { id: string, name: string, image_url: string,
  //   team_id: int, bio_text: string, bio_looking_for_type_id: int }

  return _findUserIdByUuid(uuid)
  .then(userId => {

    return knex('users')
      .select('users.*')
      .where({ heila: true })
      .then(userRows => {
        if (_.isEmpty(userRows)) {
          return [];
        }
        const heilaIds = userRows.map(user => {
          return user.uuid;
        })
        return knex('heilas')
          .select('heilas.*')
          .whereIn('uuid', heilaIds)
          .then(heilaRows => {
            if (_.isEmpty(heilaRows)) {
              return [];
            }
            const unfilteredHeilalist = _heilaRowsToObjectList(_mergeUserHeilaRows(userRows, heilaRows));
            const myType = unfilteredHeilalist.filter(h => h.id == userId)[0].bio_looking_for_type_id || -1;

            return knex('matches')
              .select('matches.*')
              .where({ 'userId1': userId })
              .orWhere({ 'userId2': userId })
              .then(previousMatches => {
                const filterOutIds = previousMatches.map(match => match.userId1 === userId ? match.userId2 : match.userId1);

                const filtered = unfilteredHeilalist.filter(elem => {
                  return filterOutIds.indexOf(parseInt(elem.id)) === -1;
                });

                const sameTypes = [];
                const otherTypes = [];

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
  })
}

function getHeilaByUserId(userId) {
  return knex('users')
    .select('users.*')
    .where({ id: userId })
    .then(userRows => {
      if (_.isEmpty(userRows)) {
        return [];
      }
      const heilaIds = userRows.map(user => {
        return user.uuid;
      })
      return knex('heilas')
        .select('heilas.*')
        .whereIn('uuid', heilaIds)
        .then(heilaRows => {
          if (_.isEmpty(heilaRows)) {
            return [];
          }
          return _heilaRowsToObjectList(_mergeUserHeilaRows(userRows, heilaRows))[0];
        })
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
    'pushToken': heila.pushToken,
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
  getHeilaTypes,
  deleteHeila,
  addHeilaReport,
  handleReadReceipt,
};
