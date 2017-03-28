import _ from 'lodash';
import google from 'googleapis';
const {knex} = require('../util/database').connect();
const requireEnvs = require('../util/require-envs');
const sheets = google.sheets('v4');
import * as gUtil from '../util/google';

requireEnvs([
  // TODO
]);

function init() {
  gUtil.init();
  getEvents();
}

function getEvents() {
  const request = {
    spreadsheetId: '1YkRmTDsSvePLZApAzqVqhoLik0hCrpTmeMEDaBzwwr0',
    ranges: ['A1:M60'],
    valueRenderOption: 'UNFORMATTED_VALUE',
  };

  sheets.spreadsheets.values.batchGet(request, (err, response) => {
    console.log('response', _.get(response, 'valueRanges[0].values'));
    // TODO
  });
}

export {
  init,
  getEvents,
}