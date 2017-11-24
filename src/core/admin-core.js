import _ from 'lodash';
const {knex} = require('../util/database').connect();
import {GCS_CONFIG} from '../util/gcs';
//import CONST from '../constants';
const logger = require('../util/logger')(__filename);
//import moment from 'moment-timezone';



//Admin deleteFeedItem same as in feed-core.js but doesn't need opts.client.uuid 
//to test
//DELETE localhost:3001/api/admin/feed/:id
//put in header token:[admintokenFromLocalStorage]
function deleteFeedItem(id) {
  return knex('feed_items').delete().where({
    'id': id,
  })
  .then(deletedCount => {
    if (deletedCount > 1) {
      logger.error('Deleted feed item', id);
      throw new Error('Unexpected amount of deletes happened: ' + deletedCount)
    }

    return deletedCount;
  });
}

export {
  deleteFeedItem,
};

