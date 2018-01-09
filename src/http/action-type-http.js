import * as actionTypeCore from '../core/action-type-core';
import {createJsonRoute} from '../util/express';

let getActionTypes = createJsonRoute(function(req, res) {
  return actionTypeCore.getActionTypes();
});


export {
  getActionTypes,
  getCheckIns
};
