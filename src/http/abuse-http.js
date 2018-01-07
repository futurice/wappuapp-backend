import * as abuseCore from '../core/abuse-core';
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';


const reportFeedItem = createJsonRoute(function(req, res) {
  console.log(req.body);
  const reportParams = assert({
    feedItemId: req.body.feedItemId,
    reportCreatorId: req.body.reportCreatorId,
    reportDescription: req.body.reportDescription
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

const resolveReport = createJsonRoute(function(req, res) {
  const resolveReportParams = assert({
    reportId: req.params.id,
    banned: req.body.banned
  }, 'reportResolveParams');

  return abuseCore.resolveReport(resolveReportParams)
    .then(resolvedCount => {
      if (resolvedCount === 0){
        return throwStatus(404, 'Not found')
      } else {
        return undefined;
      }
    });
});

export {
  reportFeedItem,
  resolveReport
};
