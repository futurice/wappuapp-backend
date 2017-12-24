import _ from 'lodash';
const { knex } = require('../util/database').connect();

function _sanitizeText(text) {
  if (!text) {
    return text;
  }
  return text.replace(/(\n|\r)+/g, " ");
}

function reportFeedItem(reportObj) {
  const dbRow = {
    'feed_item_id': reportObj.feedItemId,
    'report_creator_uuid': reportObj.reportCreatorUuid,
    'report_description': _sanitizeText(reportObj.reportDescription)
  }
  return knex('feed_item_reports').insert(dbRow).returning('id')
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new Error('Feed item report creation failed: ' + dbRow);
      }
      return rows.length;
    })
    .catch(err => {
      if (err.constraint === 'feed_item_reports_feed_item_id_foreign') {
        err.status = 404;
        err.message = `No such feed item: ${ dbRow.feed_item_id }`;
      } else if (err.constraint === 'feed_item_reports_report_creator_id_foreign') {
        err.status = 404;
        err.message = `No such user: ${ dbRow.report_creator_uuid }`;
      }
      throw err;
    });
}

export {
  reportFeedItem
};
