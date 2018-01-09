import * as actionTypeCore from '../core/action-type-core';
import {createJsonRoute} from '../util/express';

let getActionTypes = createJsonRoute(function(req, res) {
  return actionTypeCore.getActionTypes();
});

const getCheckIns = createJsonRoute(function(req, res)
{
  console.log('checkins of event ' + req.params.id);
  return actionCore.getCheckIns(req.params.id)
 .then(checkins =>
    {
        if (checkins === null)
       {
          const err = new Error('no checkins to event or event missing');
          err.status = 404;
         throw err;
        }
        return checkins;
    });

});

export {
  getActionTypes,
  getCheckIns
};
