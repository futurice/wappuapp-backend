const { knex } = require('../util/database').connect();
import _ from 'lodash';
import { deepChangeKeyCase } from '../util';

function getTeams(opts) {
  const isBanned = opts.client && !!opts.client.isBanned;
  const voteScoreSql = `
    (SELECT
      team_id,
      SUM(value) AS value
    FROM
      (SELECT
        wilsons(
            COUNT(CASE votes.value WHEN 1 THEN 1 ELSE null END)::int,
            COUNT(CASE votes.value WHEN -1 THEN -1 ELSE null END)::int
          ) * COUNT(votes)::numeric AS value,
        users.team_id AS team_id
      FROM feed_items
      JOIN users ON users.id = feed_items.user_id
      LEFT JOIN votes ON votes.feed_item_id = feed_items.id
      WHERE NOT users.is_banned
      GROUP BY feed_items.id, users.team_id
    ) AS sub_query
    GROUP BY team_id)
  `;

  const actionScoreSql = `
    (SELECT
      SUM(COALESCE(action_types.value, 0)) AS value,
      teams.id AS team_id,
      teams.name AS team_name,
      teams.image_path AS image_path,
      teams.city_id AS city_id
    FROM teams
    LEFT JOIN actions ON teams.id = actions.team_id ${isBanned ? '' : 'AND NOT actions.is_banned'}
    LEFT JOIN action_types ON actions.action_type_id = action_types.id
    GROUP BY teams.id)
  `;

  let sqlString = `
    SELECT
      actions_score.team_id AS id,
      actions_score.team_name AS name,
      actions_score.image_path AS image_path,
      ROUND(SUM(COALESCE(actions_score.value, 0)) + SUM(COALESCE(vote_score.value, 0))) as score,
      actions_score.city_id AS city
    FROM ${actionScoreSql} AS actions_score
    LEFT JOIN ${voteScoreSql} vote_score ON vote_score.team_id = actions_score.team_id
  `;

  let params = [];
  let whereClauses = [];

  if (opts.city) {
    whereClauses.push('actions_score.city_id = ?');
    params.push(opts.city);
  }

  if (whereClauses.length > 0) {
    sqlString += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  sqlString += `
    GROUP BY id, name, image_path, city
    ORDER BY score DESC, id
  `;

  return knex.raw(sqlString, params).then(result => {
    const noScoreRows = _.map(result.rows, row => {
      row.score = '0';
      return row;
    });

    return _.map(noScoreRows, row => deepChangeKeyCase(row, 'camelCase'));
  });
}

export { getTeams };
