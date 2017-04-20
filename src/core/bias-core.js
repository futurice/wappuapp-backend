import _ from 'lodash';
import BPromise from 'bluebird';
const {knex} = require('../util/database').connect();


const calculateBias = opts => {
  const wilsonsSql = `
    SELECT
      wilsons(
        COUNT(CASE votes.value WHEN 1 THEN 1 ELSE null END)::numeric,
        COUNT(CASE votes.value WHEN -1 THEN 1 ELSE null END)::numeric
      )
    FROM votes
    JOIN feed_items ON feed_items.id = votes.feed_item_id
    JOIN users ON users.id = feed_items.user_id
    JOIN teams ON teams.id = users.team_id
    WHERE votes.user_id = ? AND teams.id = ?
  `;

  const upsertSql = `
    INSERT INTO voter_biases(bias, user_id, team_id)
    SELECT unnest(?::numeric[]), unnest(?::int[]), unnest(?::int[])
    ON CONFLICT (user_id, team_id) DO
    UPDATE SET bias = excluded.bias;
  `;

  const trx = opts.trx || knex;

  return BPromise.map(opts.rows, row => trx.raw(wilsonsSql, [row.userId, row.teamId])
      .then(results => _.get(results, 'rows[0].wilsons', 0)
    ))
    .then(biases => {
      const params = _getParams(opts.rows);
      return trx.raw(upsertSql, [
        biases,
        params.userIds,
        params.teamIds,
      ]);
    })
};

function _getParams(rows) {
  return {
    userIds: _.map(rows, row => parseInt(row.userId)),
    teamIds: _.map(rows, row => parseInt(row.teamId)),
  };
}

export {
  calculateBias,
};
