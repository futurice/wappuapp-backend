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
    'report_creator_id': reportObj.reportCreatorId,
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

function resolveReport(reportParams) {
  return knex.transaction(function(trx) {
    return trx('feed_item_reports').update('is_resolved', true)
      .where('id', reportParams.reportId)
      .returning(['id', 'feed_item_id'])
      .then(reports => {
        if (_.isEmpty(reports)) {
          throw new Error('Feed item report resolving failed: ' + reportParams);
        }
        const [report] = reports;
        return trx('feed_items').update('is_banned', true)
          .where('id', report.feed_item_id)
          .returning('id')
          .then(feedItems=> {
            if (_.isEmpty(feedItems)) {
              throw new Error('Feed item not found: ' + report.feed_item_id);
            }
            const [feedItem] = feedItems;
            return feedItem;
          });
      })
      .catch(err => {
        throw err;
      });
    });
}

export {
  reportFeedItem,
  resolveReport
};
