// # imagesService
//      everything related to image manipulation
//
'use strict';

import * as gcs from '../util/gcs';
import * as actionCore from '../core/action-core';
import {createJsonRoute, throwStatus} from '../util/express';
import * as userCore from '../core/user-core';
import * as userImageCore from '../core/user-image-core';
import {assert} from '../validation';
import {decodeBase64Image} from '../util/base64';
import { processImage } from '../util/image-processor';

import { createOrUpdateUser } from '../core/user-core';

const logger = require('../util/logger')(__filename);
const uuidV1 = require('uuid/v1');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/gif', 'image/png']);

function getAndValidateActionType(typeName) {
  console.log('getAndvalidateActionType')
  return actionCore.getActionType(typeName)
    .then(type => {
      if (type === null) {
        throwStatus(400, `Action type ${ typeName } does not exist`);
      }

      return type;
    });
}

function getAndValidateUser(uuid) {
  console.log('getAndValidateUser')
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

function postUserImage(req, res) {
  console.log('\n\npostUserImage')
  // TODO: ASSERTTI
  const action = assert(req.body, 'userImage');

  const image = decodeBase64Image(req.body.imageData);
  //const { imageText, imageTextPosition } = req.body;
  //const imageOpts = { imageText, imageTextPosition };
  const imageOpts = {};
  const inputData = {};

  return getAndValidateUser(action.uuid)
    .then(user => {
      inputData.user = user;

      const fileName = `${ userImageCore.targetFolder }/${ uuidV1() }`;
      return uploadImage(fileName, image, imageOpts);
    })
    .then(uploadedImage => {
      console.log(uploadedImage)
      return createOrUpdateUser({
        uuid: action.uuid,
        image_path: uploadedImage.imageName
      }).then(rowsInserted => {
        //console.log('rowsInserted postUserImage handler')
        //console.log(rowsInserted)
        res.sendStatus(200);
      })
    });
};

// TODO: tarpeeton ehkä?
const getHeilaImage = createJsonRoute(function(req, res) {
  const params = assert({
    imageId: req.params.id
  }, 'imageParams');

  return userImageCore.getImageById(params.imageId)
    .then(image => {
      if (!image) {
        throwStatus(404, 'No such image id');
      } else {
        return image;
      }
    });
});

export {
  postUserImage
};
