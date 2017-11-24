import _ from 'lodash';
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';
import * as adminCore from '../core/admin-core';

const deleteFeedItem = createJsonRoute(function(req, res) {
  const id = assert(req.params.id, 'common.primaryKeyId');

//Same as in feed-http.js, except this doesn't use opts.uuid parameter.
  return adminCore.deleteFeedItem(id)
  .then(deletedCount => {
    if (deletedCount === 0) {
      // NOTE: deletedCount === 0, might also mean "forbidden" because the uuid
      // restriction is done in the SQL
      // In both cases, we just inform the user with Not Found
      return throwStatus(404, 'Not Found');
    } else {
      // Return 200 OK
      return undefined;
    }
  });
});

export {
  deleteFeedItem
}
