// # imagesService
//      everything related to image manipulation
//
'use strict';

import * as gcs from '../util/gcs';
import * as userImageCore from '../core/user-image-core';
import {decodeBase64Image} from '../util/base64';
import { processImage } from '../util/image-processor';

const logger = require('../util/logger')(__filename);
const uuidV1 = require('uuid/v1');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/gif', 'image/png']);

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
    } catch (e) {
      console.log(e);
      reject(e);
    }
    const imageOpts = {};

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
