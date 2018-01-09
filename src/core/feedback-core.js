import _ from 'lodash';

const BPromise = require('bluebird');
const {knex} = require('../util/database').connect();

function eventExists(eventId)
{
  console.log('kattotaas');
  return knex('events')
  .select('*')
  .where('id', eventId)
  .then( rows =>
    {
      console.log('jabadabaduu');
      if ( _.isEmpty(rows))
      {
        return null;
      }
      else
      {
        return rows.length;
      }
    });
}

function giveFeedback( feedback = {})
{
  console.log('jebin :DDDDD');
  console.log('eventti ' + feedback.eventId);
  console.log('palautteena ' + feedback.feedback);
  console.log('annan arvosanaksi ' + feedback.grade + '/5');

    return knex('feedback')
    .insert(
      {
       event_id: feedback.eventId,
       feeback_text: feedback.feedback,
       grade: feedback.grade
     })
     .then( function()
     {
      return true;
     })
     .fail(function()
     {
        return null;
     });
}

export{
   giveFeedback,
   eventExists
 };
