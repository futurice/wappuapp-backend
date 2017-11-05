import _ from 'lodash';
const {knex} = require('../util/database').connect();
import {GCS_CONFIG} from '../util/gcs';

const targetFolder = 'heilas';

/**
 * Get image by it's id.
 *
 * NOTE: id can't contain possible path
 */
function getImageById(id) {
  const sqlString = `
    SELECT
      feed_items.created_at as created_at,
      feed_items.image_path as image_path,
      COALESCE(user_name, 'SYSTEM') as user_name,
      team_name,
      vote_score(feed_items) as votes,
      feed_items.hot_score as hot_score
    FROM feed_items
    LEFT JOIN (
      SELECT
        users.id as user_id,
        users.name as user_name,
        teams.name as team_name
      FROM users
      JOIN teams ON teams.id = users.team_id
    ) users ON users.user_id = feed_items.user_id
    WHERE
      feed_items.image_path = ? AND
      NOT feed_items.is_banned
    `;

  return knex.raw(sqlString, [`${ targetFolder }/${ id }`])
  .then(result => {
    const rows = result.rows;

    if (_.isEmpty(rows)) {
      return undefined;
    }

    return _rowToImage(rows[0]);
  });
}

function _rowToImage(row) {
  var imageObj = {
    votes: row['votes'],
    hotScore: row['hot_score'],
    author: {
      name: row['user_name'],
      team: row['team_name']
    },
    createdAt: row['created_at']
  };

  const imagePath = row['image_path'];

  if (process.env.DISABLE_IMGIX === 'true' || _.endsWith(imagePath, 'gif')) {
    imageObj.url = GCS_CONFIG.baseUrl + '/' + GCS_CONFIG.bucketName + '/' + imagePath;
  } else {
    imageObj.url =
      'https://' + GCS_CONFIG.bucketName + '.imgix.net/' + imagePath +
      process.env.IMGIX_QUERY;
  }

  return imageObj;
}

export {
  targetFolder,
  getImageById
};
