// # imagesService
//      everything related to image manipulation
//
'use strict';

import * as gcs from '../util/gcs';
import * as actionCore from '../core/action-core';
import {createJsonRoute, throwStatus} from '../util/express';
import * as userCore from '../core/user-core';
import * as imageCore from '../core/image-core';
import {assert} from '../validation';
import {decodeBase64Image} from '../util/base64';
import { processImage } from '../util/image-processor';
const {knex} = require('../util/database').connect();

const logger = require('../util/logger')(__filename);
const uuidV1 = require('uuid/v1');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/gif', 'image/png']);

function getAndValidateActionType(typeName) {
  return actionCore.getActionType(typeName)
    .then(type => {
      if (type === null) {
        throwStatus(400, `Action type ${ typeName } does not exist`);
      }

      return type;
    });
}

function getAndValidateUser(uuid) {
  return userCore.findByUuid(uuid)
    .then(user => {
      if (user === null) {
        throwStatus(400, `User with uuid ${ uuid } does not exist`);
      }

      return user;
    });
}

function uploadImage(imageName, imageFile, imageOpts) {
  logger.info('Uploading', imageName);

  return Promise.resolve()
    .then(() => validateMimeType(imageFile.mimetype))
    .then(() => {
      if (imageFile.mimetype === 'image/gif') {
        return imageFile.buffer;
      } else {
        return processImage(imageFile.buffer, imageOpts);
      }
    })
    .then(buffer => gcs.uploadImageBuffer(imageName, buffer));
};

function validateMimeType(mimetype) {
  if (ALLOWED_MIME_TYPES.has(mimetype)) {
    return Promise.resolve();
  } else {
    throw new Error(`Unsupported file type ${ mimetype } uploaded`);
  }
}



const getImage = createJsonRoute(function(req, res) {
  const params = assert({
    imageId: req.params.id
  }, 'imageParams');

  return imageCore.getImageById(params.imageId)
    .then(image => {
      if (!image) {
        throwStatus(404, 'No such image id');
      } else {
        return image;
      }
    });
});

function postImage(req, res) {
  const action = assert(req.body, 'action');

  const image = decodeBase64Image(req.body.imageData);
  const { imageText, imageTextPosition } = req.body;
  const imageOpts = { imageText, imageTextPosition };
  const inputData = {};

  return getAndValidateActionType(action.type)
    .then(type => {
      inputData.type = type;

      return getAndValidateUser(action.user);
    })
    .then(user => {
      inputData.user = user;

      const fileName = `${ imageCore.targetFolder }/${ uuidV1() }`;
      return uploadImage(fileName, image, imageOpts);
    })
    .then(uploadedImage => {
      return actionCore.createAction({
        ip:        req.ip,
        isBanned:  req.client.isBanned,
        type:      action.type,
        user:      action.user,
        location:  action.location,
        imagePath: uploadedImage.imageName,
        city:      action.city,
        client:    req.client
      }).then(rowsInserted => undefined);
    });
}

/**
 * Route handler for removing a single image
 *
 * @param {HttpRequest} req Client request
 * @param {HttpResponse} res Client response
 */
function remove(req, res) {
  return checkExists(req, res)
    .then(exists => {
      if (exists) {
        return;
      }

      return delImgVotes(req.params.id)
        .then(() => delImg(req.params.id))
        .then(() => {
          res.sendStatus(200);
        })
    })
}

/**
 * Checks if image exists in database.
 * Responds with 404 if it doesn't and returns true
 *
 * @param {HttpRequest} req Client request
 * @param {HttpResponse} res Client response
 *
 * @returns {boolean} True if response was sent, false otherwise
 */
function checkExists(req, res) {
  return knex.raw(`
    SELECT *
    FROM images
    WHERE id = ${req.params.id}
  `).then(rows => {
    if (rows.rows.length === 0) {
      res.sendStatus(404);

      return true;
    } else {
      return false;
    }
  });
}

/**
 * Deletes votes for an image with given id from database
 *
 * @param {string} id Image database ID
 */
function delImgVotes(id) {
  return knex.raw(`
    SELECT *
    FROM votes
    WHERE image_id = ${id}
  `).then(rows => {
    return Promise.all(rows.map(r => {
      return knex.raw(`
        DELETE FROM votes
        WHERE id = ${r.id}
      `)
    }))
  })
}

/**
 * Deletes an image with given id from database. Note: Does not remove image votes.
 *
 * @param {string} id Image database ID
 */
function delImg(id) {
  return knex.raw(`
    DELETE FROM images WHERE id = ${id}
  `);
}

export {
  getImage,
  postImage,
  remove
};
