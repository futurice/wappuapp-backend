import _ from 'lodash';
import * as feedCore from './feed-core.js';
import { GCS_CONFIG } from '../util/gcs';
const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();


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
    'image_path': heila.image_path
  };

  return dbRow;
}

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
function _heilaRowToObject(row) {

  // jos kuvaa ei ole uploadattu, palautetaan tyhjä merkkijono
  let url = '';
  if (row.image_path) {
    url = `${GCS_CONFIG.baseUrl}/${GCS_CONFIG.bucketName}/${row.image_path}`;
  }
 
  return {
    id: row.id,
    uuid: row.uuid,
    image_path: row.image_path || '',
    // tässä asetetaan image_urli, jolla sen voi hakea verkosta ja näyttää
    // urlia ei oikeasti ole laitettu kantaan, siellä on vain image_path
    image_url: url
  };
}

export {
  createOrUpdateHeila,
  findByUuid,
  getHeilaDetails
};
