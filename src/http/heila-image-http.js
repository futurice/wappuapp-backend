// # imagesService
//      everything related to image manipulation
//
'use strict';

import * as gcs from '../util/gcs';
import * as actionCore from '../core/action-core';
import {createJsonRoute, throwStatus} from '../util/express';
import * as heilaCore from '../core/heila-core';
import * as heilaImageCore from '../core/heila-image-core';
import {assert} from '../validation';
import {decodeBase64Image} from '../util/base64';
import { processImage } from '../util/image-processor';

import { createOrUpdateHeila } from '../core/heila-core';

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

function getAndValidateHeila(uuid) {
  console.log('getAndValidateHeila')
  return heilaCore.findByUuid(uuid)
    .then(user => {
      if (user === null) {
        throwStatus(400, `Heila with uuid ${ uuid } does not exist`);
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

const getHeilaImage = createJsonRoute(function(req, res) {
  const params = assert({
    imageId: req.params.id
  }, 'imageParams');

  return heilaImageCore.getImageById(params.imageId)
    .then(image => {
      if (!image) {
        throwStatus(404, 'No such image id');
      } else {
        return image;
      }
    });
});

function postHeilaImage(req, res) {
  // TODO: ASSERTTI
  const action = assert(req.body, 'heilaImage');

  const image = decodeBase64Image(req.body.imageData);
  //const { imageText, imageTextPosition } = req.body;
  //const imageOpts = { imageText, imageTextPosition };
  const imageOpts = {};
  const inputData = {};

  return getAndValidateHeila(action.uuid)
    .then(user => {
      inputData.user = user;

      const fileName = `${ heilaImageCore.targetFolder }/${ uuidV1() }`;
      return uploadImage(fileName, image, imageOpts);
    })
    .then(uploadedImage => {
      console.log(uploadedImage)
      return createOrUpdateHeila({
        uuid: action.uuid,
        image_path: uploadedImage.imageName
      })
    });
};

export {
  getHeilaImage,
  postHeilaImage
};
