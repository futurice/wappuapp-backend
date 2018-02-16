const {knex} = require('../util/database').connect();

function giveFeedback(feedback) {
  return knex('events')
    .select('events.id')
    .then(eRows => {
      const eventIds = eRows.map(r => r.id);

      if (eventIds.indexOf(parseInt(feedback.id)) === -1) {
        // event id doesn't exist
        return null;
      }

      return knex('feedback')
      .insert({
        uuid: feedback.uuid,
        event_id: feedback.id, // eslint-disable-line
        feeback_text: feedback.text, // eslint-disable-line
        grade: feedback.grade
       })
      .then(fRows => fRows)
    })
}

export {
   giveFeedback
};
