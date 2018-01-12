import _ from 'lodash';
import {throwStatus} from '../util/express';

import jwt from 'jwt-simple';
import crypto from 'crypto';
const {knex} = require('../util/database').connect();
require('../init-env-variables');

function tokenForUser(id) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: id, iat: timestamp }, process.env.JWT_SECRET);
};

function sendTokenWithEmail(email, token) {
  var sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);
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
          value: 'http://addresstotheadminpanel.asd/changepassword?token=' + token,
        },
      ],
    },
  });
  sendgrid.API(request)
    .then(response => {
      return true;
    })
    .catch(error => {
      console.log("Error sending mail")
      console.log(error.response.statusCode)
      return false;
    });
};


export function login(email, uuid) {
  return knex('role').select('id').where('email', email).first()
    .then(id => {
      return knex('users').select('id').where('uuid', uuid)
        .then(rows => {
          if (!_.isEmpty(rows)) {
            return knex('users').update({role: id.id}).where('uuid', uuid).returning('id')
              .then(row => {
                if (_.isEmpty(row)) {
                  return throwStatus(500, 'User linking failed')
                }})
                return {admin: true};
          } else {
            return knex('role').select('admin').where('email', email).first()
              .then(admin => {
                return { admin: admin.admin, token: tokenForUser(id.id) };
          })}
        })
      })
}

export function addmoderator(origemail, email, password) {
  return knex('role').select('id').where('email', email).orWhere('email', email)
  .then(rows => {
    if (_.isEmpty(rows)) {
      return knex('role').insert({ email: email, password: password }).returning('id')
      .then(result => {
        const [id] = result;
        const token = tokenForUser(id);
        return sendTokenWithEmail(origemail, token);
      })
    } else {
      return throwStatus(422, 'User with the given email exists');
    }
  });
}

export function deletemoderator(id) {
  return knex('role').where('id', id).del()
  .then(result => {
    if (result == 1) {
      return throwStatus(200, 'User deleted');
    } else {
      return throwStatus(404, 'Moderator not found');
    }
  });
}

export function changePassword(password, user) {
  return knex('role').where('id', user).update({password: password, activated: true}).returning('id')
  .then(row => {
    if (_.isEmpty(row)) {
      return throwStatus(404, 'There was an error');
    } else {
      return throwStatus(200, 'Password changed');
    }
  });
}

export function promote(id) {
  return knex('role').where('id', id).update({admin: true}).returning('id')
  .then(row => {
    if (_.isEmpty(row)) {
      return throwStatus(404, 'Moderator not found');
    } else {
      return throwStatus(200, 'User promoted to admin');
    }
  });
}

export function demote(id) {
  return knex('role').where('id', id).update({admin: false}).returning('id')
  .then(row => {
    if (_.isEmpty(row)) {
      return throwStatus(404, 'Moderator not found');
    } else {
      return throwStatus(200, 'User demoted to moderator');
    }
  });
}

export function modList() {
  return knex('role').select('id', 'email', 'activated', 'admin')
  .then(rows => {
    if (_.isEmpty(rows)) {
      return throwStatus(404, 'No moderator list');
    } else {
      for (var i = 0; i < rows.length; i++) {
        const decipher = crypto.createDecipher('aes192', process.env.CRYPTO_PASSWORD)
        var email = decipher.update(rows[i].email, 'hex', 'utf8');
        email += decipher.final('utf8')
        rows[i].email = email
      }
      return rows;
    }
  });
}

export function forgottenpw(origemail, email) {
  return knex('role').select('id').where('email', email)
  .then(result => {
    const [id] = result;
    if (id == undefined) {
      return throwStatus(404, 'User with given email does not exist');
    }
    const token = tokenForUser(id.id);
    return sendTokenWithEmail(origemail, token);
  })
}
