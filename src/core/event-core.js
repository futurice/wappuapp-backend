import _ from 'lodash';
const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();
import {getDistance} from '../util/geometry';
import moment from 'moment-timezone';
import { getFeed } from './feed-core';

/**
 *
 * @param {number} opts.eventId
 * @param {number} opts.client.id
 */
function getEventById(opts = {}) {
  return getEvents(opts)
    .then(events => {
      if (_.isEmpty(events)) {
        return undefined;
      }

      const getImagesPromise = getFeed({
        eventId:       opts.eventId,
        client:        opts.client,
        type:          'IMAGE',
        limit:         50,
        includeSticky: false,
      });

      return BPromise.all([
        _rowToEvent(events[0]),
        getImagesPromise
      ]).spread((event, images) => {
        event.images = images;

        return event;
      });

    });
}

function addEvent(event) {
  return knex('events').insert(event);
}

function updateEvent(event) {
  return knex('events').where('id', event.id).update(event)
}

function getUpdateEvent(id) {
  return knex('events').select('*').where('id', id)
}

function getAllEvents(city_id) {
  if (city_id === '0') {
    return knex('events').select('*')
  }
  return knex('events').select('*').where('city_id', city_id)
}

function deleteEvent(id) {
  return knex('events').where('id', id).del()
}

function getEvents(opts) {
  const where = _getWhereClause(opts);

  return knex('events')
    .select([
      'id',
      'name',
      'location_name',
      'start_time',
      'end_time',
      'description',
      'organizer',
      'contact_details',
      'teemu',
      'location',
      'cover_image',
      'city_id AS city',
      'fb_event_id',
      'attending_count',
      'radius',
    ])
    .whereRaw(where.sql, where.params)
    .orderBy('start_time', 'asc')
    .then(rows => _.map(rows, _rowToEvent))
    .then(events => {
      
      // get actions of CHECK_IN_TYPE and count and group
      // by event_id
      return knex('actions')
        .select('event_id')
        .where({ action_type_id: 9 })
        .count('event_id')
        .groupBy('event_id')
        .then(checkIns => {
          const checkInObject = {};
          checkIns.forEach(ci => checkInObject[ci.event_id] = ci.count);
          return events.map(event => {
          // add checkinCounts to events
            event['checkinCount'] = (event.id in checkInObject)
              ? parseInt(checkInObject[event.id]) : 0;
            return event;
          })
        })
    })
};

function setAttendingCount(facebookEventId, attendingCount) {
  return knex.transaction(trx =>
    trx('events')
      .update('attending_count', attendingCount)
      .where('fb_event_id', '=', facebookEventId)
  );
}

function _getWhereClause(filters) {
  let whereClauses = [
    'show = TRUE',
    'end_time IS NOT NULL',
    'start_time IS NOT NULL',
  ];
  let params = [];

  if (filters.city) {
    whereClauses.push('city_id = ?');
    params.push(filters.city);
  }

  if (filters.id) {
    whereClauses.push('id = ?');
    params.push(filters.id);
  }

  if (!filters.showPast) {
    whereClauses.push('end_time > CURRENT_TIMESTAMP')
  }

  return {
    sql: whereClauses.join(' AND '),
    params,
  };
}

function _rowToEvent(row) {
  return {
    id:             row['id'],
    name:           row['name'],
    locationName:   row['location_name'],
    startTime:      row['start_time'],
    endTime:        row['end_time'],
    description:    row['description'],
    organizer:      row['organizer'],
    contactDetails: row['contact_details'],
    teemu:          row['teemu'],
    coverImage:     row['cover_image'],
    city:           row['city'],
    fbEventId:      row['fb_event_id'],
    attendingCount: row['attending_count'],
    checkingCount:  row['checkinCount'],
    radius:         row['radius'],
    location: {
      latitude:  _.get(row, 'location.y', null),
      longitude: _.get(row, 'location.x', null),
    },
  };
}

// Checks if checking in with the given parameters would be feasable.
// DOES NOT check if user has already checked in, thus the result
// is not a guarantee of a successfull check in.
function isValidCheckIn(action) {
  return knex('events').select('*').where('id', '=', action.eventId)
    .then(events => {
      if (events.length === 0) {
        let err = new Error(`No such event id: ${ action.eventId }`);
        err.status = 404;
        throw err;
      } else if (events.length > 1) {
        let err = new Error('Unexpected number of rows');
        err.status = 500;
        throw err;
      } else {
        return events[0];
      }
    })
    .then(event => {
      if (!_eventOnGoing(event)) throw new Error('Event not ongoing');
      return event;
    })
    .then(event => {

      if (!event.location) {
        throw new Error('Event has no location coordinates');
      }

      let eventLocation = {
        latitude: event.location.y,
        longitude: event.location.x,
      };

      if (!_userInVicinity(action.location, eventLocation, event.radius)) {
        throw new Error('Not close enough to event for check in');
      }
      return event;
    })
    .catch(err => {
      err.status = err.status || 403;
      throw err;
    });
}

function _eventOnGoing(event) {
  return moment().utc().isBetween(
    moment(event.start_time).utc(),
    moment(event.end_time).utc()
  );
}

function _userInVicinity(actionLocation, eventLocation, eventRadius) {
  const distanceToEvent = getDistance(
      actionLocation,
      eventLocation,
    );
  return distanceToEvent <= eventRadius;
}

export {
  getEventById,
  getEvents,
  setAttendingCount,
  isValidCheckIn,
  addEvent,
  deleteEvent,
  updateEvent,
  getAllEvents,
  getUpdateEvent
};
