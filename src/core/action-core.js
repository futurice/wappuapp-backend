import _ from 'lodash';
const {knex} = require('../util/database').connect();
import {createFeedItem} from './feed-core';

function _sanitizeText(text) {
  if (!text) {
    return text;
  }

  return text.replace(/(\n|\r)+/g, " ");
}

function createAction(action) {
  const actionRow = {
    'team_id':        action.client.team,
    'action_type_id': knex.raw('(SELECT id from action_types WHERE code = ?)', [action.type]),
    'user_id':        action.client.id,
    'image_path':     action.imagePath,
    'text':           _sanitizeText(action.text),
    'ip':             action.ip,
    'event_id':       action.eventId,
  };

  const location = action.location;
  if (location) {
    // Tuple is in longitude, latitude format in Postgis
    actionRow.location = location.longitude + ',' + location.latitude;
  }
  if (action.isBanned) {
    actionRow.is_banned = action.isBanned;
    actionRow.aggregated = true;
  }

  return knex.transaction(function(trx) {
    return trx('actions').returning('*').insert(actionRow)
      .then(rows => {
        if (_.isEmpty(rows)) {
          throw new Error('Action row creation failed: ' + actionRow);
        }

        action.id = rows[0].id;
        action.client.team = rows[0].team_id;

        if (action.type === 'IMAGE' || action.type === 'TEXT') {
          return createFeedItem(action, trx);
        }

        return Promise.resolve();
    })
  })
  .catch(err => {
    if (err.constraint === 'only_one_check_in_per_event') {
      err.status = 403;
      err.message = 'Duplicate check in attempted';
    }
    throw err;
  });
}

function markAsAggregated(actionId, trx) {
  trx = trx || knex;

  return trx('actions')
    .where('id', actionId)
    .update('aggregated', true)
    .returning('id')
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('Marking action as aggregated failed: ' + actionId);
      }

      return rows.length;
    });
}

function getActionType(code) {
  return knex('action_types')
    .select('*')
    .limit(1)
    .where('code', code)
    .then(rows => {
      if (_.isEmpty(rows)) {
        return null;
      }

      return _actionTypeRowToObject(rows[0]);
    });
}

function getCheckIns(event)
{
  return knex('actions')
  .select('*')
  .where({action_type_id:9, event_id: event})
  .then(rows =>
    {
      if (_.isEmpty(rows))
      {
        return null;
      }
      return rows.length;
    });
}

function _actionTypeRowToObject(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    value: row.value,
    cooldown: row.cooldown
  };
}

export {
  createAction,
  getActionType,
  markAsAggregated,
  getCheckIns
};
