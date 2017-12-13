import _ from 'lodash';
import * as feedCore from './feed-core.js';
import { prefixImageWithGCS } from './image-core.js'
import { GCS_CONFIG } from '../util/gcs';
const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();


function checkHeilaTableStatus(user) {
  return findByUuid(user.uuid)
    .then(foundHeila => {
      
      // if heila table row doesn't exist -> create it
      if (foundHeila === null && user.heila === true) {
        console.log('heila not found + heila = true --> add table row');
        return createHeila(user);
      // if heila table row exists but it shouldn't -> delete it
      } else if (foundHeila !== null && user.heila === false) {
        console.log('heila found + heila = false --> drop table row');
        return deleteHeila(user);
      } else {
        console.log(`heila: ${user.heila} + foundHeila: ${foundHeila} --> doing nothing`);
        return 1;
      }
    })
}

function deleteHeila(heila) {
  return knex('heilas')
    .where({ uuid: heila.uuid })
    .del()
    .then(delCount => {
      console.log('deleted this many heila rows:');
      console.log(delCount);
      if (delCount === 0) {
        throw new Error(`Couldn't del heila uuid ${heila.uuid}`);
      }
    })
}

function createOrUpdateHeila(heila) {
  console.log('createOrUpdateHeila')
  console.log(heila)
  return findByUuid(heila.uuid)
  .then(foundHeila => {
    if (foundHeila === null) {
      return createHeila(heila);
    } else {
      return updateHeila(heila);
    }
  });
}

function createHeila(heila) {
  console.log('createHeila')
  const dbRow = _makeHeilaDbRow(heila);
  return knex('heilas').returning('id').insert(dbRow)
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('Heila row creation failed: ' + dbRow);
      }

      return rows.length;
    });
}

function updateHeila(heila) {
  console.log('updateHeila')
  const dbRow = _makeHeilaDbRow(heila);
  console.log(dbRow)
  return knex('heilas').returning('id').update(dbRow)
    .where('uuid', heila.uuid)
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('Heila row update failed: ' + dbRow);
      }

      return rows.length;
    });
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

/**
 * Get heila's details
 *
 * @param {object} opts
 * @param {number} opts.heilaId
 * @param {object} opts.client
 */
function getHeilaDetails(opts) {
  console.log('getHeilaDetails')
  const heilaDetailsQuery = _queryHeilaDetails(opts.heilaId);

  const imagesQuery = feedCore.getFeed({
    client:        opts.client,
    heilaId:        opts.heilaId,
    type:          'IMAGE',
    includeSticky: false,
    limit:         50,
  });

  return BPromise.all([
    heilaDetailsQuery,
    imagesQuery
  ]).spread((heilaDetails, images) => {
    if (!heilaDetails) {
      return null;
    }

    heilaDetails.images = images;

    return heilaDetails;
  });
}

function _queryHeilaDetails(heilaId) {
  const sqlString = `
  SELECT
    heilas.name AS name,
    teams.name AS team,
    COALESCE(num_simas, 0) AS num_simas
  FROM heilas
  JOIN teams ON teams.id = heilas.team_id
  LEFT JOIN (
    SELECT
      actions.heila_id AS heila_id,
      COUNT(*) AS num_simas
    FROM actions
    JOIN action_types ON action_types.id = actions.action_type_id
    WHERE action_types.code = 'SIMA'
    GROUP BY heila_id
  ) AS stats ON heilas.id = stats.heila_id
  WHERE heilas.id = ?
  `;

  return knex.raw(sqlString, [heilaId])
    .then(result => {
      if (result.rows.length === 0) {
        return null;
      }

      const rowObj = result.rows[0];
      return {
        name: rowObj['name'],
      };
    });
}

function _makeHeilaDbRow(heila) {
  const dbRow = {
    'uuid': heila.uuid,
    'bio_text': heila.bio_text || '',
    'bio_looking_for': heila.bio_looking_for || '',
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
  getHeilaDetails,
  getAllHeilas,
  checkHeilaTableStatus,
};
