import _ from 'lodash';
import {createJsonRoute, throwStatus} from '../util/express';

import jwt from 'jwt-simple';
import crypto from 'crypto';
import sendgrid from 'sendgrid';
const {knex} = require('../util/database').connect();
require('../init-env-variables');

function tokenForUser(id) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: id, iat: timestamp }, process.env.JWT_SECRET);
};

function sendTokenWithEmail(email, token) {
  sendgrid(process.env.SENDGRID_API_KEY);
  const request = sendgrid.emptyRequest({
    method: 'POST',
    path: 'v3/mail/send',
    body: {
      personalization: [
        {
          to: [
            {
              email: email,
            },
          ],
          subject: "Activation mail for your WhappuApp adminpanel account",
        },
      ],
      from: {
        email: 'admin@whappuapp',
      },
      content: [
        {
          type: 'text/plain',
          value: 'http://addresstotheadminpanel.asd/changepassword?token='+token,
        },
      ],
    },
  });
  sendgrid.api(request)
    .then(response => {
      return true;
    })
    .catch(error => {
      console.log("Error sending mail")
      console.log(error.response.statusCode)
      return false;
    });
};

const login = createJsonRoute(function(req, res) {
  const email = req.body.email;
  return knex('role').select('id').where('email', email).first()
    .then(id => {
      return knex('role').select('admin').where('email', email).first()
        .then(admin => {
          return { admin: admin.admin, token: tokenForUser(id.id) };
        })
    })
});

const addmoderator = createJsonRoute(function(req, res, next) {
  const email = req.body.email;
  if (!email) {
    return throwStatus(400, 'Email must be provided');
  }
  var password = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0,30);
  password = crypto.createHash('md5').update(password).digest("hex");
  return knex('role').select('id').where('email', email).orWhere('email', email)
  .then(rows => {
    if (_.isEmpty(rows)) {
      return knex('role').insert({ email: email, password: password }).returning('id')
      .then(result => {
        const [id] = result;
        const token = tokenForUser(id);
        sendTokenWithEmail(req.body.email, token);
      })
    } else {
      return throwStatus(422, 'User with the given email exists');
    }
  });
});

const deletemoderator = createJsonRoute(function(req, res, next) {
  return knex('role').where('id', req.params.id).del()
  .then(result => {
    if (result == 1) {
      return throwStatus(200, 'User deleted');
    } else {
      return throwStatus(404, 'Email not found');
    }
  });
});

const changepw = createJsonRoute(function(req, res, next) {
  const password = crypto.createHash('md5').update(req.body.password).digest("hex");
  return knex('role').where('id', req.user).update({password: password, activated: true}).returning('id')
  .then(row => {
    if (_.isEmpty(row)) {
      return throwStatus(404, 'There was an error');
    } else {
      return throwStatus(200, 'Password changed');
    }
  });
});

const forgottenpw = createJsonRoute(function(req, res, next) {
  return knex('role').select('id').where('email', req.params.email)
  .then(result => {
    const [id] = result;
    if (id == undefined) {
      return throwStatus(404, 'User with given email does not exist');
    }
    const token = tokenForUser(id.id);
    sendTokenWithEmail(req.params.email, token);
  })
});

const promote = createJsonRoute(function(req, res, next) {
  return knex('role').where('id', req.params.id).update({admin: true}).returning('id')
  .then(row => {
    if (_.isEmpty(row)) {
      return throwStatus(404, 'Moderator not found');
    } else {
      return throwStatus(200, 'User promoted to admin');
    }
  });
});

const demote = createJsonRoute(function(req, res, next) {
  return knex('role').where('id', req.params.id).update({admin: false}).returning('id')
  .then(row => {
    if (_.isEmpty(row)) {
      return throwStatus(404, 'Moderator not found');
    } else {
      return throwStatus(200, 'User demoted to moderator');
    }
  });
});

const modlist = createJsonRoute(function(req, res, next) {
  return knex('role').select('id', 'email', 'activated', 'admin')
  .then(rows => {
    if (_.isEmpty(rows)) {
      return throwStatus(404, 'No moderator list');
    } else {
      return rows;
    }
  });
});

export {
  modlist,
  deletemoderator,
  promote,
  demote,
  changepw,
  forgottenpw,
  login,
  addmoderator
};
