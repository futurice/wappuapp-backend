import _ from 'lodash';
import * as feedCore from './feed-core.js';
import { putUserImage } from '../http/user-image-http.js';
import { prefixImageWithGCS } from './image-core.js';

const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();

function createOrUpdateUser(user) {
  console.log('createOrUpdateUser');
  console.log(user.uuid);
  return findByUuid(user.uuid)
  .then(foundUser => {
    if (foundUser === null) {
      return createUser(user);
    } else {
      if (user.imageData) {
        return updateUserImage(user);
      } else {
        return updateUser(user);
      }
    }
  });
}

function createUser(user) {
  console.log('createUser')
  console.log(user)
  const dbRow = _makeUserDbRow(user);
  return knex('users').returning('id').insert(dbRow)
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('User row creation failed: ' + dbRow);
      }

      return rows.length;
    });
}

function runDbUpdate(user) {
  console.log('runDbUpdate');
  console.log(user);
  const dbRow = _makeUserDbRow(user);
  console.log('dbRow')
  console.log(dbRow)
  return knex('users').returning('id').update(dbRow)
    .where('uuid', user.uuid)
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('User row update failed: ' + dbRow);
      }
      return rows.length;
    });
}

function updateUser(user) {
  console.log('updateUser')
  return runDbUpdate(user);
}

function updateUserImage(user) {
  console.log('updateUserImage')
    // putUserImage asettaa kuvan kantaan itsenäisesti
  return putUserImage(user.imageData, user.uuid)
  .then(uploadedImageName => {
    // alkup. user-objektissa ei image_pathia mukana
    // asetetaan image_path
    user['image_path'] = uploadedImageName;
    delete user['imageData'];
    runDbUpdate(user);
  })
}

function findByUuid(uuid) {
  return knex('users')
    .select(
      'users.*'
    )
    .where({ uuid: uuid })
    .then(rows => {
      if (_.isEmpty(rows)) {
        return null;
      }

      return _userRowToObject(rows[0]);
    });
}

/**
 * Get user's details
 *
 * @param {object} opts
 * @param {number} opts.userId
 * @param {object} opts.client
 */
function getUserDetails(opts) {
  const userDetailsQuery = _queryUserDetails(opts.userId);

  const imagesQuery = feedCore.getFeed({
    client:        opts.client,
    userId:        opts.userId,
    type:          'IMAGE',
    includeSticky: false,
    limit:         50,
  });

  return BPromise.all([
    userDetailsQuery,
    imagesQuery
  ]).spread((userDetails, images) => {
    if (!userDetails) {
      return null;
    }

    userDetails.images = images;

    return userDetails;
  });
}

function _queryUserDetails(userId) {
  const sqlString = `
  SELECT
    users.name AS name,
    teams.name AS team,
    COALESCE(num_simas, 0) AS num_simas
  FROM users
  JOIN teams ON teams.id = users.team_id
  LEFT JOIN (
    SELECT
      actions.user_id AS user_id,
      COUNT(*) AS num_simas
    FROM actions
    JOIN action_types ON action_types.id = actions.action_type_id
    WHERE action_types.code = 'SIMA'
    GROUP BY user_id
  ) AS stats ON users.id = stats.user_id
  WHERE users.id = ?
  `;

  return knex.raw(sqlString, [userId])
    .then(result => {
      if (result.rows.length === 0) {
        return null;
      }

      const rowObj = result.rows[0];
      return {
        name: rowObj['name'],
        team: rowObj['team'],
        numSimas: rowObj['num_simas']
      };
    });
}

function _makeUserDbRow(user) {
  const dbRow = {
    'uuid': user.uuid,
    'name': user.name,
    'team_id': user.team,
    'image_path': user.image_path,
    'heila': user.heila
  };

  return dbRow;
}

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
function _userRowToObject(row) {
  let obj = {
    id: row.id,
    name: row.name,
    uuid: row.uuid,
    team: row.team_id,
    isBanned: row.is_banned,
    heila: row.heila,
  };

  if (row.image_path !== "") {
    obj["image_url"] = prefixImageWithGCS(row.image_path);
  } else {
    obj["image_url"] = "";
  }

  return obj;
}

export {
  createOrUpdateUser,
  findByUuid,
  getUserDetails
};
