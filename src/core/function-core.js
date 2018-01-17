const process = require('process');
const fetch = require('node-fetch');

const URL_CREATE_CHAT = "https://us-central1-whappu-183808.cloudfunctions.net/addNewChatBetweenUsers";
const URL_ADD_PUSHTOKEN = "https://us-central1-whappu-183808.cloudfunctions.net/addPushTokenForUserId";

function createChatForTwoUsers(matchRow) {
  console.log('createChatForTwoUsers');
  const current_url = `${URL_CREATE_CHAT}?userId1=${matchRow.userId1}&userId2=${matchRow.userId2}`;
  console.log(current_url);
  return fetch(current_url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'FUNCTION_SECRET_KEY': process.env.FUNCTION_SECRET_KEY
    }
  })
  .then(res => res.json())
  .then(data => {
    return data.chatKey;
  })
};

function addPushNotificationTokenForUserId(userId, pushToken) {
  console.log('addPushNotificationTokenForUserId');
  const current_url = `${URL_ADD_PUSHTOKEN}?userId=${userId}&pushToken=${pushToken}`;
  console.log(current_url);
  return fetch(current_url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'FUNCTION_SECRET_KEY': process.env.FUNCTION_SECRET_KEY
    }
  })
  .catch(err => {
    console.log(err);
  })
};

export {
  createChatForTwoUsers,
  addPushNotificationTokenForUserId
}
