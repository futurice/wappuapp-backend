const {knex} = require('../util/database').connect();
const logger = require('../util/logger')(__filename);
import {createFeedItem} from '../core/feed-core';
import _ from 'lodash';

function deleteFeedItem(id) {
  return knex('feed_items').update({is_banned: true}).where({
    'id': id,
  })
  .then(deletedCount => {
    if (deletedCount > 1) {
      logger.error('Deleted feed item', id);
      throw new Error('Unexpected amount of deletes happened: ' + deletedCount);
    }

    return deletedCount;
  });
}

function shadowBanUser(id) {
  return knex('users').where('id', id).update({is_banned: true})
  .then(updatedCount => {
    if (updatedCount > 1) {
      logger.error('Banned user with ID ', id);
      throw new Error('Unexpected amount of bans happened: ', updatedCount);
    }
    return updatedCount;
  })
}

function unBanUser(id) {
  return knex('users').where('id', id).update({is_banned: false})
  .then(updatedCount => {
    if (updatedCount > 1) {
      logger.error('Unbanned user with ID ', id);
      throw new Error('Unexpected amount of unbans happened: ', updatedCount);
    }
    return updatedCount;
  })
}

function _sanitizeText(text) {
  if (!text) {
    return text;
  }

  return text.replace(/(\n|\r)+/g, " ");
}

function sendSystemMessage(action) {
  const actionRow = {
    'team_id':        action.client.team,
    'action_type_id': knex.raw('(SELECT id from action_types WHERE code = ?)', [action.type]),
    'user_id':        action.client.id,
    'image_path':     action.imagePath,
    'text':           _sanitizeText(action.text),
    'ip':             action.ip,
    'event_id':       action.eventId,
    'parent_id':      action.parent_id,
  };

  const location = action.location;
  if (location){
    actionRow.location = location.longitude + ',' + location.latitude;
  }
  return knex.transaction(function(trx) {
    return trx('actions').returning('*').insert(actionRow)
      .then(rows => {
        if (_.isEmpty(rows)) {
          throw new Error('Action row creation failed: ' + actionRow);
        }

        action.id = rows[0].id;
        action.client.team = rows[0].team_id;

        if (action.type === 'TEXT') {
          logger.info('Announcing system message');
          //return createFeedItem(action, trx);
          return createFeedItem({
            type: 'TEXT',
            //text: `${action.text}`,
            text: action.text,
            user: null,
            isSticky: true
          });
        }

        return Promise.resolve();
    });
  });
}

export {
  deleteFeedItem,
  shadowBanUser,
  unBanUser,
  sendSystemMessage
};
