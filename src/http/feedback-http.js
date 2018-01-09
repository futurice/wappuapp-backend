import _ from 'lodash'
import * as feedbackCore from '../core/feedback-core'
import * as eventCore from '../core/event-core'
import {createJsonRoute, throwStatus} from '../util/express';
import {assert} from '../validation';

const postFeedback = createJsonRoute(function(req, res)
{
console.log('giving feedback to event');

console.log('id ' + req.params.id);
console.log(req.body);

console.log('################################################3');

console.log('ebin');

const feedbackParams =
  {
    eventId: req.params.id,
    feedback: req.body.feedback,
    grade: req.body.grade,
  };

  eventCore.getEventById(
    {
      eventId: req.params.id,
      client: req.client
    }
  ).then(event=>
    {
      if(!event)
      {
        {
        return throwStatus(404, 'No such event id');
        }
      }
    else
      {
       return feedbackCore.giveFeedback(feedbackParams)
       .then( result =>
        {
          console.log('ebin3');
          if(result === null)
        {
         return 'Could not give feedback';
        }
        else
        {
         return 'Feedback given';
        }
       })
      }
    });

    console.log('ebin2');


});

export
{
  postFeedback
};
