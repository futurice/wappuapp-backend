'use strict';

import _ from 'lodash';
import streamifier from 'streamifier';
import * as base64 from './base64';
const logger = require('./logger')(__filename);

const requireEnvs = require('./require-envs');
requireEnvs([
  'GCS_PRIVATE_KEY',
  'GCS_BUCKET_NAME',
  'GCS_TYPE',
  'GCS_PROJECT_ID',
  'GCS_PRIVATE_KEY_ID',
  'GCS_PRIVATE_KEY',
  'GCS_CLIENT_EMAIL',
  'GCS_CLIENT_ID',
  'GCS_AUTH_URI',
  'GCS_TOKEN_URI',
  'GCS_AUTH_PROVIDER_X509_CERT_URL',
  'GCS_CLIENT_X509_CERT_URL',
  'GCS_CLIENT_EMAIL',
]);

const PRIVATE_KEY = base64.decodeBase64String(process.env.GCS_PRIVATE_KEY);
const GCS_CONFIG = {
  bucketName: process.env.GCS_BUCKET_NAME,
  baseUrl: 'https://storage.googleapis.com',

  type: process.env.GCS_TYPE,
  projectId: process.env.GCS_PROJECT_ID,
  project_id: process.env.GCS_PROJECT_ID,
  private_key_id: process.env.GCS_PRIVATE_KEY_ID,
  private_key: process.env.GCS_PRIVATE_KEY,
  client_email: process.env.GCS_CLIENT_EMAIL,
  client_id: process.env.GCS_CLIENT_ID,
  auth_uri: process.env.GCS_AUTH_URI,
  token_uri: process.env.GCS_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GCS_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GCS_CLIENT_X509_CERT_URL,

  credentials: {
    private_key: PRIVATE_KEY,
    client_email: process.env.GCS_CLIENT_EMAIL,
  },
};
const gcloud = require('gcloud')(GCS_CONFIG);

const gcs = gcloud.storage();
const bucket = gcs.bucket(process.env.GCS_BUCKET_NAME);

// # API
//
// uploadImage
function uploadImageBuffer(imageName, imageBuffer) {
  logger.info('Uploading image to Google Cloud Storage..');
  return new Promise(function(resolve, reject) {
    const file = bucket.file(imageName);

    streamifier
      .createReadStream(imageBuffer)
      .pipe(
        file.createWriteStream({
          metadata: { contentType: 'image/jpeg' },
        })
      )
      .on('error', function(error) {
        reject(error);
      })
      .on('finish', function() {
        file.makePublic(function(error, response) {
          if (error) {
            return reject(error);
          }
          resolve({
            imageName,
            uploaded: true,
          });
        });
      });
  });
}

const pathToUrl = imagePath => {
  if (!imagePath || _.startsWith(imagePath, 'http')) {
    return imagePath;
  }

  return process.env.DISABLE_IMGIX === 'true' || _.endsWith(imagePath, 'gif')
    ? GCS_CONFIG.baseUrl + '/' + GCS_CONFIG.bucketName + '/' + imagePath
    : 'https://' + GCS_CONFIG.bucketName + '.imgix.net/' + imagePath + process.env.IMGIX_QUERY;
};

export { uploadImageBuffer, pathToUrl, GCS_CONFIG };
