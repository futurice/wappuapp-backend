import * as abuseCore from '../core/abuse-core';
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';


const reportFeedItem = createJsonRoute(function(req, res) {
  const reportParams = assert({
    feedItemId: req.query.feedItemId,
    reportCreatorUuid: req.query.reportCreatorUuid,
    reportDescription: req.query.reportDescription
  }, 'reportParams');

  return abuseCore.reportFeedItem(reportParams)
    .then(reportedCount => {
      if (reportedCount === 0){
        return throwStatus(404, 'Not found')
      } else {
        return undefined;
      }
    });
});

export {
  reportFeedItem
};
