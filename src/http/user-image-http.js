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

function putUserImage(imgBase64, uuid) {
  return new Promise(function(resolve, reject) {

    console.log('\n\nputUserImage')
    // console.log(imgBase64)
    let image;
    try {
      image = decodeBase64Image(imgBase64);
    } catch(e) {
      console.log(e);
      reject(e);
    }
    //const { imageText, imageTextPosition } = req.body;
    //const imageOpts = { imageText, imageTextPosition };
    const imageOpts = {};
    const inputData = {};

    const fileName = `${ userImageCore.targetFolder }/${ uuidV1() }`;
    return uploadImage(fileName, image, imageOpts)
            .then(uploadedImage => {
              console.log('image upload ok!')
              console.log('updating user fields in db')
              resolve(uploadedImage.imageName);
            })
            .catch(e => {
              console.log('rejecting putUserImage in uploadImage catch');
              reject(e);
            });
  });
};

export {
  putUserImage
};
