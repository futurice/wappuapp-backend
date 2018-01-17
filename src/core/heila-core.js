import _ from 'lodash';
import * as feedCore from './feed-core.js';
import { prefixImageWithGCS } from './image-core.js'
import { GCS_CONFIG } from '../util/gcs';
import { addPushNotificationTokenForUserId } from './function-core.js';

const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();

function createOrUpdateHeila(heila) {
  console.log('createOrUpdateHeila')
  console.log(heila)
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
  console.log('createHeila')
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
        addPushNotificationTokenForUserId(heila.userId, heila.pushToken);
      }
      return rows.length;
    });
}

function updateHeila(heila) {
  console.log('updateHeila')
  const dbRow = _makeHeilaDbRow(heila);
  console.log(dbRow)
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
        addPushNotificationTokenForUserId(heila.userId, heila.pushToken);
      }

      return rows.length;
    });
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
  console.log('heila-core::findByUuid ' + uuid);
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

function getAllHeilas() {
  console.log('getAllHeilas');

  // palauttaa listan, jossa tällaisia objekteja:
  // { id: string, name: string, image_url: string,
  //   team_id: int, bio_text: string, bio_looking_for: string }

  return knex('users')
    .select('users.*')
    .where({ heila: true })
    .then(userRows => {
      if (_.isEmpty(userRows)) {
        return [];
      }
      console.log('userRows::::')
      console.log(userRows)
      const heilaIds = userRows.map(user => {
        return user.uuid;
      })
      console.log(heilaIds)
      return knex('heilas')
        .select('heilas.*')
        .whereIn('uuid', heilaIds)
        .then(heilaRows => {
          console.log(heilaRows);
          if (_.isEmpty(heilaRows)) {
            return [];
          }
          return _heilaRowsToObjectList(_mergeUserHeilaRows(userRows, heilaRows));
        })
    })
}

function getHeilaByUserId(userId) {
  console.log('getHeilaByUserId'); 
  return knex('users')
    .select('users.*')
    .where({ id: userId })
    .then(userRows => {
      if (_.isEmpty(userRows)) {
        return [];
      }
      console.log('userRows::::')
      console.log(userRows)
      const heilaIds = userRows.map(user => {
        return user.uuid;
      })
      console.log(heilaIds)
      return knex('heilas')
        .select('heilas.*')
        .whereIn('uuid', heilaIds)
        .then(heilaRows => {
          console.log(heilaRows);
          if (_.isEmpty(heilaRows)) {
            return [];
          }
          return _heilaRowsToObjectList(_mergeUserHeilaRows(userRows, heilaRows))[0];
        })
    })

}

function _mergeUserHeilaRows(userRows, heilaRows) {
  // mergetään user-profiilit ja heila-profiilit
  // lopputuloksena palautetaan lista, jossa
  // sekä userin tiedot että heilan tiedot samassa
  // objektissa
  userRows.forEach(user => {
    for (let i = 0; i < heilaRows.length; i += 1) {
      if (user.uuid === heilaRows[i].uuid) {
        user = Object.assign(user, heilaRows[i]);
        break;
      }
    }
  })
  console.log('merged userRows:');
  console.log(userRows);
  return userRows;
}

function _heilaRowsToObjectList(userList) {

  // userList sisältää _VAIN_ heila: true -tyyppisiä profiileja

  const heilaList = userList
    .map(user => {
      return {
        id: user.id,
        name: user.name,
        team_id: user.team_id,
        image_url: user.image_path ? prefixImageWithGCS(user.image_path) : null,
        bio_text: user.bio_text,
        bio_looking_for: user.bio_looking_for
      }
    })
  console.log("heilaList")
  console.log(heilaList)
  return heilaList;
}

function _makeHeilaDbRow(heila) {
  const dbRow = {
    'userId': heila.userId,
    'uuid': heila.uuid,
    'bio_text': heila.bio_text,
    'bio_looking_for': heila.bio_looking_for,
    'pushToken': heila.pushToken,
  };

  return dbRow;
}

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
function _heilaRowToObject(row) {
  console.log("heilaRowToObject")
  console.log(row)
  // jos kuvaa ei ole uploadattu, palautetaan tyhjä merkkijono
  let url = null;
  if (row.image_path) {
    url = `${GCS_CONFIG.baseUrl}/${GCS_CONFIG.bucketName}/${row.image_path}`;
  }

  return {
    id: row.id,
    uuid: row.uuid,
    // tässä asetetaan image_urli, jolla sen voi hakea verkosta ja näyttää
    // urlia ei oikeasti ole laitettu kantaan, siellä on vain image_path
    image_url: url,
    bio_text: row.bio_text,
    bio_looking_for: row.bio_looking_for,
  };
}

export {
  createOrUpdateHeila,
  findByUuid,
  getAllHeilas,
  getHeilaByUserId,
};
