import _ from 'lodash';
import * as eventCore from '../core/event-core';
import { createJsonRoute, throwStatus } from '../util/express';
import { assert } from '../validation';

const getEvent = createJsonRoute(function(req, res) {
  return eventCore
    .getEventById({
      eventId: req.params.id,
      client: req.client,
    })
    .then(event => {
      if (!event) {
        throwStatus(404, 'No such event id');
      } else {
        return event;
      }
    });
});

const getEvents = createJsonRoute(function(req, res) {
  const eventParams = assert(
    {
      id: req.params.id,
      city: req.query.cityId,
      showPast: req.query.showPast,
    },
    'eventsParams'
  );

  const coreParams = _.merge(eventParams, {
    client: req.client,
  });

  return eventCore.getEvents(coreParams).then(results => {
    if (req.params.id !== undefined) {
      if (results.length > 1) {
        throw new Error('Unexpected number of rows');
      } else if (results.length === 0) {
        throwStatus(404, 'No such event id');
      } else {
        return results[0];
      }
    } else {
      // Respond with an array of objects otherwise.
      return results;
    }
  });
});

function isValidCheckIn(action) {
  return eventCore.isValidCheckIn(action);
}

export { getEvent, getEvents, isValidCheckIn };
