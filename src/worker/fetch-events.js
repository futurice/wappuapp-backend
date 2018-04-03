#!/usr/bin/env node
import _ from 'lodash';
import google from 'googleapis';
import util from '../util/seeds';
import BPromise from 'bluebird';
import requireEnvs from '../util/require-envs';
import * as citiesCore from '../core/cities-core';
import moment from 'moment-timezone';
const { knex } = require('../util/database').connect();
const logger = require('../util/logger')(__filename);
const sheets = google.sheets('v4');

requireEnvs(['GSHEETS_EVENTS', 'GSHEETS_API_KEY']);

const eventSheets = JSON.parse(process.env.GSHEETS_EVENTS);
const batchGetAsync = BPromise.promisify(sheets.spreadsheets.values.batchGet);
const cities = {};

_fetchEvents()
  .then(() => {
    logger.info('Event data updated');
    process.exit();
  })
  .catch(err => {
    logger.error('Updating events errored', err);
    process.exit(1);
  });

function _fetchEvents() {
  logger.info('Updating events data');
  return citiesCore
    .getCities({ city: null })
    .then(rows => {
      rows.forEach(city => {
        cities[city.name] = city.id;
      });
    })
    .then(() =>
      BPromise.map(eventSheets, eventSheet => {
        const request = {
          spreadsheetId: eventSheet.id,
          ranges: ['A:M'],
          valueRenderOption: 'UNFORMATTED_VALUE',
          key: process.env.GSHEETS_API_KEY,
        };

        return batchGetAsync(request).then(response => {
          let payload = _.get(response, 'valueRanges[0].values', null);

          if (!payload || payload.length === 0) {
            BPromise.resolve();
          }

          return _extractAndSaveData(payload, eventSheet);
        });
      })
    );
}

function _extractAndSaveData(payload, eventSheet) {
  const headers = _getHeaders(_.flatMap(_.pullAt(payload, [0])));
  const events = _getEvents(payload, headers, eventSheet.city);

  return BPromise.map(events, (event, index) =>
    util.insertOrUpdate(
      knex,
      'events',
      {
        code: _getCode(eventSheet.city, index, event, headers),
        city_id: cities[eventSheet.city],
        name: _getString(event, headers, 'name'),
        location_name: _getString(event, headers, 'locationName'),
        start_time: _getTimeStamp(event, headers, 'startTime'),
        end_time: _getTimeStamp(event, headers, 'endTime'),
        description: _getString(event, headers, 'description'),
        organizer: _getString(event, headers, 'organizer'),
        contact_details: _getString(event, headers, 'contactDetails'),
        teemu: _getBoolean(event, headers, 'isTeemu', false),
        location: _getLocation(event, headers),
        cover_image: _getString(event, headers, 'coverImage'),
        fb_event_id: _getString(event, headers, 'facebookId', null),
        show: _getBoolean(event, headers, 'show', true),
        radius: event[headers['radius']] || process.env.DEFAULT_EVENT_RADIUS,
      },
      'code'
    )
  );
}

function _getHeaders(headers) {
  const indexedHeaders = {};
  _.forEach(headers, (header, index) => (indexedHeaders[header] = index));
  return indexedHeaders;
}

function _getEvents(payload, headers, city) {
  const filteredEvents = _filterEmpties(payload);
  return city === 'Otaniemi'
    ? _getLatest(_groupEventsById(filteredEvents, headers), headers)
    : filteredEvents;
}

function _filterEmpties(events) {
  return _.filter(events, event => !_.isEmpty(event));
}

function _groupEventsById(events, headers) {
  return _.groupBy(events, event => event[headers['eventId']]);
}

function _getLatest(eventsById, headers) {
  return _.map(eventsById, events => _.maxBy(events, event => event[headers['Timestamp']]));
}

function _getCode(city, index, event, headers) {
  switch (city) {
    case 'Otaniemi':
      return `${city}_${event[headers['eventId']]}`;
    case 'Tampere':
      return `${city}_${index}`;
    default:
      throw new Error('Attempted to get code for unsupported city');
      break;
  }
}

function _getLocation(event, headers) {
  const lat = parseFloat(event[headers['locationLat']]);
  const lng = parseFloat(event[headers['locationLon']]);

  return _.isFinite(lat) && _.isFinite(lng) ? `${lng},${lat}` : null;
}

function _getTimeStamp(event, headers, column) {
  const dateString = event[headers[column]];

  return moment(dateString, moment.ISO_8601).isValid() ? dateString : null;
}

function _getBoolean(event, headers, column, defaultValue = false) {
  const cellData = event[headers[column]];
  return Boolean(cellData) ? cellData == 'true' : defaultValue;
}

function _getString(event, headers, column, defaultValue = '') {
  const parsedString = event[headers[column]];
  return !_.isEmpty(parsedString) ? parsedString : defaultValue;
}
