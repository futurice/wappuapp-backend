import _ from 'lodash';
import BPromise from 'bluebird';
const {knex} = require('../util/database').connect();
const redisClient = require('../util/redis').connect().client;
import {deepChangeKeyCase} from '../util';


const KEY_TEAMS = 'teams';
const KEY_IS_STALE = 'teamsAreStale';
const KEY_IS_UPDATING = 'teamsAreUpdating';
const CACHE_TTL = process.env.TEAMS_CACHE_TTL ||  60 * 10; // in 's'
let initializeModulePromise;

function initialize() {
  initializeModulePromise = _isStale().then(stale => stale ? _updateCache() : BPromise.resolve());
}

function _getField(cityId) {
  return `city_${ cityId ? cityId : 'all' }`;
}

function getTeams(opts) {
  _isStale().then(stale => {
    // Incur a cache refresh if necessary
    if (stale) {
      _updateCache();
    }
  });

  // Do not await for update to complete as it may take some time.
  return BPromise.resolve(initializeModulePromise).then(() =>
    redisClient.hgetAsync(KEY_TEAMS, _getField(opts.city))
      .then(result => JSON.parse(result))
  );
}

function _isStale() {
  return redisClient.getAsync(KEY_IS_STALE).then(stale => stale !== 'false');
}

function _isUpdating() {
  return redisClient
    .getAsync(KEY_IS_UPDATING)
    .then(isUpdating => isUpdating == 'true');
}

/**
 * Updates the cache if no update is in progress. Otherwise does nothing.
 *
 * To note is that checking for on going update is best effort only. Overlapping
 * updates are possible, but should be very uncommon and not impact the
 * generated cache in a negative way.
 **/
function _updateCache() {
  const update = redisClient.setAsync(KEY_IS_UPDATING, 'true')
    .then(() => knex('cities').select('*')
      // Cache per city team rankings
      .then(cities =>
        BPromise.map(cities, city =>
          _getTeams(city.id).then(teams =>
            redisClient.hmsetAsync(KEY_TEAMS, _getField(city.id), JSON.stringify(teams))
          )
        )
      )
      // Cache nation wide team rankings
      .then(() =>
        _getTeams().then(teams =>
            redisClient.hmsetAsync(KEY_TEAMS, _getField(), JSON.stringify(teams))
        )
      )
      .then(() => redisClient.msetAsync(KEY_IS_STALE, 'false', KEY_IS_UPDATING, 'false'))
      .then(() => redisClient.expire(KEY_IS_STALE, CACHE_TTL))
    );

  return _isUpdating().then(isUpdating => isUpdating ? BPromise.resolve() : update());
}

function _getTeams(city) {
  const voteScoreSql = `
    (SELECT
      team_id,
      SUM(value) AS value
    FROM
      (SELECT
        wilsons(
          SUM(CASE votes.value WHEN 1 THEN (1 - voter_biases.bias) ELSE null END)::numeric,
          SUM(CASE votes.value WHEN -1 THEN voter_biases.bias ELSE null END)::numeric
        ) * COUNT(votes) AS value,
        users.team_id AS team_id
      FROM (
        SELECT feed_items.*
        FROM feed_items
        JOIN users ON users.id = feed_items.user_id AND NOT users.is_banned
      ) feed_items
      JOIN users ON users.id = feed_items.user_id
      LEFT JOIN votes ON votes.feed_item_id = feed_items.id
      LEFT JOIN voter_biases ON voter_biases.user_id = votes.user_id AND voter_biases.team_id = users.team_id
      GROUP BY feed_items.id, users.team_id
    ) AS sub_query
    GROUP BY team_id)
  `;

  const actionScoreSql = `
    (SELECT
      SUM(COALESCE(action_types.value, 0)) AS value,
      teams.id AS team_id
    FROM teams
    LEFT JOIN actions ON teams.id = actions.team_id AND NOT actions.is_banned
    LEFT JOIN action_types ON actions.action_type_id = action_types.id
    LEFT JOIN users ON users.id = actions.user_id AND NOT users.is_banned
    GROUP BY teams.id)
  `;

  let sqlString = `
    SELECT
      teams.id AS id,
      teams.name AS name,
      teams.image_path AS image_path,
      (COALESCE(actions_score.value, 0) + COALESCE(vote_score.value, 0))::int AS score,
      teams.city_id AS city
    FROM teams
    LEFT JOIN ${ actionScoreSql } actions_score ON actions_score.team_id = teams.id
    LEFT JOIN ${ voteScoreSql } vote_score ON vote_score.team_id = actions_score.team_id
  `;

  let params = [];
  let whereClauses = [];

  if (city) {
    whereClauses.push('teams.city_id = ?');
    params.push(city);
  }

  if (whereClauses.length > 0) {
    sqlString += ` WHERE ${ whereClauses.join(' AND ')}`;
  }

  sqlString += `
    GROUP BY id, name, image_path, city, actions_score.value, vote_score.value
    ORDER BY score DESC, id
  `;

  return knex.raw(sqlString, params)
  .then(result => {
    return _.map(result.rows, row => deepChangeKeyCase(row, 'camelCase'));
  });
}

export {
  initialize,
  getTeams,
};
