import * as commentCore from '../core/comment-core';
import { createJsonRoute, throwStatus } from '../util/express';
import { assert } from '../validation';

const deleteComment = createJsonRoute(function(req, res) {
  const id = assert(req.params.id, 'common.primaryKeyId');

  return commentCore.deleteComment(id, { client: req.client }).then(deletedCount => {
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

export { deleteComment };
