const {knex} = require('../util/database').connect();
const logger = require('../util/logger')(__filename);

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

