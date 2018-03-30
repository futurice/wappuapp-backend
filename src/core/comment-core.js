import _ from 'lodash';
import * as imageCore from './image-core';
import { pathToUrl } from '../util/gcs';
import * as imageHttp from '../http/image-http';
import { decodeBase64Image } from '../util/base64';
import moment from 'moment-timezone';
const { knex } = require('../util/database').connect();
const BPromise = require('bluebird');
const uuidV1 = require('uuid/v1');

function _makeCommentDbRow(action) {
  const row = {
    user_id: action.client.id,
    feed_item_id: action.feedItemId,
  };

  if (action.text) {
    row.text = action.text;
  }

  if (action.imagePath) {
    row.image_path = action.imagePath;
  }

  return row;
}

function newComment(action) {
  // image if needed
  const filePath = `${imageCore.targetFolder}/${uuidV1()}`;

  const saveImage = action.imageData
    ? imageHttp.uploadImage(filePath, decodeBase64Image(action.imageData))
    : BPromise.resolve(null);

  return saveImage.then(imgPath => {
    const imgUpdate = imgPath ? { imagePath: imgPath.imageName } : {};
    const commentUpdate = _.merge({}, action, imgUpdate);
    const dbRow = _makeCommentDbRow(commentUpdate);

    knex('comments')
      .insert(dbRow)
      .catch(err => {
        if (err.constraint === 'comments_feed_item_id_foreign') {
          const error = new Error('No such feed item id');
          error.status = 404;
          throw error;
        }

        throw err;
      });
  });
}

function deleteComment(id, opts) {
  opts = opts || {};

  return knex('comments')
    .delete()
    .where({
      id: id,
      user_id: knex.raw('(SELECT id from users WHERE uuid = ?)', [opts.client.uuid]),
    })
    .then(deletedCount => {
      if (deletedCount > 1) {
        logger.error('Deleted comment', id, 'client uuid:', opts.client.uuid);
        throw new Error('Unexpected amount of deletes happened: ' + deletedCount);
      }

      return deletedCount;
    });
}

export { newComment, deleteComment };
