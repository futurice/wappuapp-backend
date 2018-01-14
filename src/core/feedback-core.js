import _ from 'lodash';
const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();

function giveFeedback(feedback) {
  console.log('feedbackCore::giveFeedback');
  console.log(feedback);
  return knex('feedback')
  .insert({
    uuid: feedback.uuid,
    event_id: feedback.id,
    feeback_text: feedback.text,
    grade: feedback.grade
   }).then(rows => {
     return true;
   }).catch(err => {
     // this happens if the event id doesn't exist
     return false;
   })
}

export{
   giveFeedback
};
