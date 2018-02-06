import * as feedbackCore from '../core/feedback-core'
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';

const postFeedback = createJsonRoute(function(req, res) {
  const feedback = assert(req.body, 'feedback');
  return feedbackCore.giveFeedback(feedback)
   .then(ret => {
     if (!ret) {
      throwStatus(404, `Event id ${feedback.id} does not exist`);
     }
   })
});

export {
  postFeedback
};
