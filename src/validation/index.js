var _ = require('lodash');
var Joi = require('joi');
import CONST from '../constants';

var common = {
  team: Joi.number().integer().min(0),
  userUuid: Joi.string().regex(/^[A-Za-z0-9_-]+$/).min(1, 'utf8').max(128, 'utf8'),
  primaryKeyId: Joi.number().integer().min(0)
};

const schemas = {
  common: common,

  action: {
    user: common.userUuid.required(),
    type: Joi.string().uppercase().required(),
    imageData: Joi.string().when('type', { is: 'IMAGE', then: Joi.required() }),
    imageText: Joi.string().max(50, 'utf8').optional(),
    imageTextPosition: Joi.number().min(0).max(1).optional(),
    text: Joi.string().when('type', { is: 'TEXT', then: Joi.required() }),
    eventId: common.primaryKeyId.when('type', { is: 'CHECK_IN_EVENT', then: Joi.required()}),
    city: common.primaryKeyId,
    location: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number()
    }).when('type', {is: 'CHECK_IN_EVENT', then: Joi.required()}),
  },

  user: {
    uuid: common.userUuid.required(),
    name: Joi.string().min(1, 'utf8').max(50, 'utf8').required(),
    team: common.team.required()
  },

  heila: {
    uuid: common.userUuid.required(),
    imageData: Joi.string().when('type', { is: 'IMAGE', then: Joi.required() }),
  },

  userQueryParams: {
    userId: common.primaryKeyId.required(),
  },

  feedParams: {
    city: common.primaryKeyId,
    beforeId: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    since: Joi.date().iso(),
    offset: Joi.number().integer().min(0),
    type: Joi.string()
      .valid(['TEXT', 'IMAGE'])
      .optional(),
    sort: Joi.string()
      .valid(CONST.FEED_SORT_TYPES_ARRAY)
      .default(CONST.FEED_SORT_TYPES.NEW)
      .optional(),
  },

  imageParams: {
    imageId: Joi.string().required()
  },

  vote: {
    value: Joi.number().integer().valid(-1, 1),
    feedItemId: Joi.number().integer().required(),
  },

  upsertMoodParams: {
    rating: Joi.number().precision(4).min(0).max(10).required(),
    description: Joi.string().min(1, 'utf8').max(128, 'utf8').optional().allow([null]).default(null),
    location: Joi.object({
      latitude: Joi.number(),
      longitude: Joi.number()
    }),
  },

  getMoodParams: {
    user: common.primaryKeyId,
    team: common.primaryKeyId,
    city: common.primaryKeyId,
  },

  radioParams: {
    city: common.primaryKeyId,
    id: common.primaryKeyId,
  },

  eventsParams: {
    city: common.primaryKeyId,
    id: common.primaryKeyId,
    showPast: Joi.boolean().default(false),
  },

  citiesParams: {
    city: common.primaryKeyId,
  },

  teamsParams: {
    city: common.primaryKeyId,
  },
};

const conversions = {};

function assert(obj, schemaName) {
  var joiObj = _getSchema(schemaName);

  // All this hassle to get joi to format nice error messages
  var content = {};
  content[schemaName] = obj;
  var expected = {};
  expected[schemaName] = joiObj;

  var result = Joi.validate(content, expected);

  if (result.error) {
    if (!result.error.isJoi) {
      throw result.error;
    }

    _throwJoiError(result.error);
  }

  // Return for convenience
  return result.value[schemaName];
}

// Converts string `value` to a correct js object.
// `schemaName` refers to key in `conversion` object. It defines all
// conversion functions.
function convert(obj, schemaName) {
  return _.reduce(obj, (memo, val, key) => {
    var func = _getConversion(schemaName)
    if (_.isFunction(func)) {
      memo[key] = func(val);
    } else {
      memo[key] = val;
    }
    return memo;

  }, {});
}

function _getConversion(name) {
  var conversion = _.get(conversions, name);
  if (!conversion) {
    throw new Error('Conversion with name ' + name + ' was not found');
  }
  return conversion;
}

function _getSchema(name) {
  var joiObj = _.get(schemas, name);
  if (!joiObj) {
    throw new Error('Schema with name ' + name + ' was not found');
  }
  return joiObj;
}

function _throwJoiError(err) {
  // See https://github.com/hapijs/joi/blob/v7.2.3/API.md#errors
  var msg = _.get(err, 'details.0.message') || 'Validation error';
  var newErr = new Error(msg);
  newErr.status = 400;
  throw newErr;
}

export {
  assert,
  convert,
  common,
  schemas
};
