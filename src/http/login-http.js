import { createJsonRoute, throwStatus } from "../util/express";
import crypto from "crypto";
require("../init-env-variables");
import * as loginCore from "../core/login-core";

const login = createJsonRoute(function(req, res) {
  var email = req.body.email;
  const cipher = crypto.createCipher("aes192", process.env.CRYPTO_PASSWORD);
  email = cipher.update(email, "utf8", "hex");
  email += cipher.final("hex");
  const uuid = req.headers["x-user-uuid"];
  return loginCore.login(email, uuid);
});

const addModerator = createJsonRoute(function(req, res, next) {
  var email = req.body.email;
  if (!email) {
    return throwStatus(400, "Email must be provided");
  }
  const cipher = crypto.createCipher("aes192", process.env.CRYPTO_PASSWORD);
  email = cipher.update(email, "utf8", "hex");
  email += cipher.final("hex");
  var password = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 30);
  password = crypto
    .createHash("md5")
    .update(password)
    .digest("hex");
  return loginCore.addModerator(req.body.email, email, password);
});

const deleteModerator = createJsonRoute(function(req, res, next) {
  return loginCore.deleteModerator(req.params.id);
});

const changePW = createJsonRoute(function(req, res, next) {
  const oldpassword = crypto
    .createHash("md5")
    .update(req.body.oldpassword)
    .digest("hex");
  const newpassword = crypto
    .createHash("md5")
    .update(req.body.newpassword)
    .digest("hex");
  return loginCore.changePassword(newpassword, oldpassword, req.user);
});

const activateAccount = createJsonRoute(function(req, res, next) {
  const password = crypto
    .createHash("md5")
    .update(req.body.password)
    .digest("hex");
  return loginCore.activateAccount(password, req.user);
});

const forgottenPW = createJsonRoute(function(req, res, next) {
  const cipher = crypto.createCipher("aes192", process.env.CRYPTO_PASSWORD);
  var email = cipher.update(req.params.email, "utf8", "hex");
  email += cipher.final("hex");
  return loginCore.forgottenPW(req.params.email, email);
});

const promote = createJsonRoute(function(req, res, next) {
  return loginCore.promote(req.params.id);
});

const demote = createJsonRoute(function(req, res, next) {
  return loginCore.demote(req.params.id);
});

const modList = createJsonRoute(function(req, res, next) {
  return loginCore.modList().then(rows => {
    for (var i = 0; i < rows.length; i++) {
      const decipher = crypto.createDecipher(
        "aes192",
        process.env.CRYPTO_PASSWORD
      );
      var email = decipher.update(rows[i].email, "hex", "utf8");
      email += decipher.final("utf8");
      rows[i].email = email;
    }
    return rows;
  });
});

export {
  modList,
  deleteModerator,
  promote,
  demote,
  changePW,
  forgottenPW,
  login,
  addModerator,
  activateAccount
};
