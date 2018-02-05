import _ from 'lodash';
const {knex} = require('../util/database').connect();
import {GCS_CONFIG} from '../util/gcs';
import CONST from '../constants';
const logger = require('../util/logger')(__filename);
import * as score from './score-core';
import moment from 'moment-timezone';
import BPromise from 'bluebird';

const FEED_ITEM_TYPES = new Set(['IMAGE', 'TEXT', 'CHECK_IN']);

function getStickySqlString(city) {
  const whereCitySql = !city
    ? ' AND feed_items.city_id IS NULL'
    : knex.raw(` AND (feed_items.city_id = ? OR feed_items.city_id IS NULL)`, city).toString();

  return `
    (SELECT
      feed_items.id as id,
      feed_items.parent_id as parent_id,
      feed_items.location as location,
      feed_items.created_at as created_at,
      feed_items.image_path as image_path,
      feed_items.text as text,
      feed_items.type as action_type_code,
      COALESCE(users.name, 'SYSTEM') as user_name,
      users.id as user_id,
      teams.name as team_name,
      vote_score(feed_items) as votes,
      feed_items.hot_score as hot_score,
      0 as top_score,
      feed_items.is_sticky,
      COALESCE(votes.value, 0) as user_vote
    FROM feed_items
    LEFT JOIN users ON users.id = feed_items.user_id
    LEFT JOIN teams ON teams.id = users.team_id
    LEFT JOIN votes ON votes.user_id = ? AND votes.feed_item_id = feed_items.id
    WHERE feed_items.is_sticky ${ whereCitySql }
    GROUP BY
      feed_items.id,
      users.name,
      users.id,
      teams.name,
      votes.value
    ORDER BY feed_items.id DESC
    LIMIT 2)`;
}

/**
 *
 * @param {object} opts
 * @param {number} opts.client.id  Client's database ID
 * @param {number} [opts.limit=20] How many results to return
 * @param {number} [opts.beforeId] Return only items before this feed item
 * @param {number} [opts.city]     Return feed items only from given city
 * @param {string} [opts.sort=new] One of ['hot', 'new', 'top']
 * @param {number} [opts.eventId]  Event whose feed items to return
 * @param {string} [opts.type]     Return only certain type items
 * @param {string} [opts.userId]   Return only certain user's items
 * @param {boolean} [opts.includeSticky = true]   Should sticky messages be included
 * @param {string} [opts.since]    Limit search to feed items created between 'since' and now.
 * @param {number} [opts.offset]    Offset results by given amount.
 */
function getFeed(opts) {
  opts = _.merge({
    includeSticky: true,
    limit: 20
  }, opts);

  let sqlString = `
    (SELECT
      feed_items.id as id,
      feed_items.parent_id as parent_id,
      feed_items.location as location,
      feed_items.created_at as created_at,
      feed_items.image_path as image_path,
      feed_items.text as text,
      feed_items.type as action_type_code,
      COALESCE(users.name, 'SYSTEM') as user_name,
      users.id as user_id,
      ${ _getTeamNameSql(opts.city) } as team_name,
      vote_score(feed_items) as votes,
      feed_items.hot_score as hot_score,
      COALESCE(feed_items.top_score, 0) as top_score,
      feed_items.is_sticky,
      COALESCE(votes.value, 0) as user_vote
    FROM feed_items
    LEFT JOIN users ON users.id = feed_items.user_id
    LEFT JOIN teams ON teams.id = users.team_id
    LEFT JOIN votes ON votes.user_id = ? AND votes.feed_item_id = feed_items.id
    LEFT JOIN cities ON cities.id = teams.city_id
    ${ _getWhereSql(opts) }
    GROUP BY
        feed_items.id,
        users.name,
        users.id,
        teams.name,
        votes.value,
        teams.city_id,
        cities.id,
        parent_id)
    `;

  let params = [opts.client.id];

  // TODO: Sticky messages should have their own endpoint
  const sortTop = opts.sort === CONST.FEED_SORT_TYPES.TOP
  const includeSticky = opts.includeSticky && !opts.beforeId && !sortTop;
  if (includeSticky) {
    sqlString = getStickySqlString(opts.city) + " UNION ALL " + sqlString;
    params.push(opts.client.id);
  }

  sqlString += _getSortingSql(opts.sort, opts.parent_id);
  sqlString += ` LIMIT ?`;
  params.push(opts.limit);

  if (opts.offset) {
    sqlString +=  ` OFFSET ?`;
    params.push(opts.offset);
  }

  return knex.raw(sqlString, params)
  .then(result => {
    const rows = result.rows;

    if (_.isEmpty(rows)) {
      return [];
    }

    return rows;
  })
  .then(rows => {
    return BPromise.all(
      _.map(rows, row => _actionToFeedObject(row, opts.client))
    )
  })
}

function _sanitizeText(text) {
  if (!text) {
    return text;
  }

  return text.replace(/(\n|\r)+/g, " ");
}

function createFeedItem(feedItem, trx) {
  if (!FEED_ITEM_TYPES.has(feedItem.type)) {
    throw new Error('Invalid feed item type ' + feedItem.type);
  }

  const dbRow = {
    'image_path': feedItem.imagePath,
    'parent_id':  feedItem.parent_id,
    'text':       _sanitizeText(feedItem.text),
    'type':       feedItem.type,
    'city_id':    feedItem.city || knex.raw('(SELECT city_id FROM teams WHERE id = ?)', [feedItem.client.team]),
    // Division to bring time stamp's accuracy inline with postgres values.
    'hot_score':  _.round(score.hotScore(0, moment.utc().valueOf() / 1000), 4)
  };

  const location = feedItem.location;
  if (location) {
    // Tuple is in longitude, latitude format in Postgis
    dbRow.location = location.longitude + ',' + location.latitude;
  }
  if (feedItem.isBanned) {
    dbRow.is_banned = feedItem.isBanned;
  }

  if (feedItem.isSticky) {
    dbRow.is_sticky = feedItem.isSticky;
  }

  if (feedItem.type === 'IMAGE' && feedItem.client) {
    // Get event_id from user's last check in and check
    // that the event is still ongoing
    dbRow.event_id = knex.raw(`
      (SELECT id
      FROM events
      WHERE
        id = (
          SELECT MAX(event_id)
          FROM actions
          JOIN action_types ON action_types.id = actions.action_type_id
          WHERE
            code = 'CHECK_IN_EVENT' AND
            user_id = ?
        ) AND now() BETWEEN start_time AND end_time)
    `, [feedItem.client.id]);
  }

  if (feedItem.client) {
    dbRow.user_id = feedItem.client.id;
  }

  trx = trx || knex;

  return trx.returning('id').insert(dbRow).into('feed_items')
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('Feed item row creation failed: ' + dbRow);
      }

      return rows.length;
    })
    .catch(err => {
      if (err.constraint === 'feed_items_city_id_foreign') {
        err.status = 404;
        err.message = `No such city id: ${ dbRow.city_id }`;
      }

      throw err;
    });
}

function deleteFeedItem(id, opts) {
  opts = opts || {};

  return knex('feed_items').delete().where({
    'id': id,
    'user_id': knex.raw('(SELECT id from users WHERE uuid = ?)', [opts.client.uuid])
  })
  .then(deletedCount => {
    if (deletedCount > 1) {
      logger.error('Deleted feed item', id, 'client uuid:', opts.client.uuid);
      throw new Error('Unexpected amount of deletes happened: ' + deletedCount)
    }

    return deletedCount;
  });
}

function _actionToFeedObject(row, client) {
  if (!client) {
    throw new Error('Client information not passed as a parameter');
  }

// _getNumberOfComments calculates the number of comments for a feedItem
  return _getNumberOfComments(row['id'], row['parent_id'], client)
  .then(numberOfComments => {
    var feedObj = {
      id: row['id'],
      type: row['action_type_code'],
      votes: row['votes'],
      userVote: row['user_vote'],
      hotScore: row['hot_score'],
      author: {
        id: row['user_id'],
        name: row['user_name'],
        team: row['team_name'],
        type: _resolveAuthorType(row, client)
      },
      createdAt: row['created_at'],
      parent_id: row['parent_id'],
      numberOfComments: numberOfComments,
    };

    if (row.location) {
      feedObj.location = {
        latitude: row.location.y,
        longitude: row.location.x
      };
    }

    if (feedObj.type === 'IMAGE') {
      const imagePath = row['image_path'];

      if (process.env.DISABLE_IMGIX === 'true' || _.endsWith(imagePath, 'gif')) {
        feedObj.url = GCS_CONFIG.baseUrl + '/' + GCS_CONFIG.bucketName + '/' + imagePath;
      } else {
        feedObj.url =
          'https://' + GCS_CONFIG.bucketName + '.imgix.net/' + imagePath +
          process.env.IMGIX_QUERY;
      }
    } else if (feedObj.type === 'TEXT') {
      feedObj.text = row.text;
    }

    return feedObj;
  });
}

function _getWhereSql(opts) {
  const whereClauses = ['NOT feed_items.is_sticky'];
  const params = [];

  if (opts.beforeId) {
    whereClauses.push('feed_items.id < ?');
    params.push(opts.beforeId);
  }

  if (!opts.client.isBanned) {
    whereClauses.push('NOT feed_items.is_banned');
  }

  if (opts.city) {
    whereClauses.push(`feed_items.city_id = ?`);
    params.push(opts.city);
  }

  if (opts.eventId) {
    whereClauses.push(`feed_items.event_id = ?`);
    params.push(opts.eventId);
  }

  if (opts.parent_id){
    whereClauses.push('feed_items.id > ?');
    params.push(opts.parent_id);

    whereClauses.push('feed_items.parent_id = ?');
    params.push(opts.parent_id);
  }

  if (opts.type) {
    whereClauses.push(`feed_items.type = ?`);
    params.push(opts.type);
  }

  if (_.isNumber(opts.userId)) {
    whereClauses.push(`feed_items.user_id = ?`);
    params.push(opts.userId);
  }

  if (opts.since) {
    whereClauses.push(`feed_items.created_at >= ?`);
    params.push(opts.since);
  }

  if (!opts.parent_id){
    whereClauses.push(`parent_id IS NULL`);
  }

  return whereClauses.length > 0
    ? knex.raw(` WHERE ${ whereClauses.join(' AND ')}`, params).toString()
    : '';
}

function _getSortingSql(sort, parent_id) {
  const { HOT, TOP } = CONST.FEED_SORT_TYPES;
  if (parent_id){
    // New comments show up at the bottom of the comments list
    return 'ORDER BY id ASC';
  } else if (sort === HOT) {
    return 'ORDER BY is_sticky DESC, hot_score DESC, id DESC';
  } else if (sort === TOP) {
    return 'ORDER BY top_score DESC, id DESC';
  } else {
    // Defaults to 'NEW'
    return 'ORDER BY is_sticky DESC, id DESC';
  }
}

function _getTeamNameSql(cityId) {
  return !cityId
    ? `teams.name`
    : knex.raw(`CASE WHEN teams.city_id=? THEN teams.name ELSE cities.name END`, [cityId]).toString();
}

function _getNumberOfComments(id, parent_id, client){
  // skip the database search if the feedItem has a parent_id
  if (parent_id){
    return BPromise.resolve(0);
  }

  let SQLrequest;
  if (client.isBanned == true){
    SQLrequest = `SELECT COUNT(id) FROM feed_items WHERE parent_id=? AND id > ?;`
  }
  else {
    SQLrequest = `SELECT COUNT(id) FROM feed_items WHERE parent_id=? AND id > ? AND is_banned = false;`
  }
  return knex.raw(SQLrequest, [id, id])
  .then(function(knexRawResult) {
    const number_of_comments = parseInt(knexRawResult.rows[0].count, 10);
    return number_of_comments;
  });
}

function _resolveAuthorType(row, client) {
  const rowUserId = row['user_id'];

  if (rowUserId === null) {
    return CONST.AUTHOR_TYPES.SYSTEM;
  } else if (rowUserId === client.id) {
    return CONST.AUTHOR_TYPES.ME;
  }

  return CONST.AUTHOR_TYPES.OTHER_USER;
}

function refreshCommentNumber(id, client){
  return _getNumberOfComments(id, null, client)
  .then(result =>{
    return result
  })
  .catch(err =>{
    throw err;
  });
};

export {
  getFeed,
  createFeedItem,
  deleteFeedItem,
  refreshCommentNumber
};
