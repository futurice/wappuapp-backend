import * as feedbackCore from '../core/feedback-core'
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';

const postFeedback = createJsonRoute(function(req, res) {
  console.log('giving feedback to event');
  const feedback = assert(req.body, 'feedback');
  console.log(feedback)
  return feedbackCore.giveFeedback(feedback)
   .then(ret => {
     if (ret === -1) {
      throwStatus(404, `Event id ${feedback.id} does not exist`);
     } else if (ret === 0) {
      throwStatus(500);
     }
   })
});

export {
  postFeedback
};
