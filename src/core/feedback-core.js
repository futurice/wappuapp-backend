import _ from 'lodash';
const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();

function giveFeedback(feedback) {
  console.log('feedbackCore::giveFeedback');
  console.log(feedback);
  return knex('events')
    .select('events.id')
    .then(rows => {
      const event_ids = rows.map(r => r.id);
      
      if (event_ids.indexOf(parseInt(feedback.id)) === -1) {
        // event id doesn't exist
        return -1;
      }

      return knex('feedback')
      .insert({
        uuid: feedback.uuid,
        event_id: feedback.id,
        feeback_text: feedback.text,
        grade: feedback.grade
       }).then(rows => {
         // success
         return 1;
       }).catch(err => {
         // something different went wrong
         console.log('something went wrong in adding feedback:');
         console.log(feedback);
         console.log(err);
         return 0;
       })
    })
}

export{
   giveFeedback
};
