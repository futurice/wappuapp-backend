import _ from 'lodash'
import * as feedbackCore from '../core/feedback-core'
import * as eventCore from '../core/event-core'
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';

const postFeedback = createJsonRoute(function(req, res)
{
  console.log('giving feedback to event');
  const feedback = assert(req.body, 'feedback');
  console.log(feedback)
  return feedbackCore.giveFeedback(feedback)
   .then(success => {
     if (!success) {
      throwStatus(400, `Event id ${feedback.id} does not exist`);
     }
   })
});

export {
  postFeedback
};
