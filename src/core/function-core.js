const process = require('process');
const fetch = require('node-fetch');

const BASE_URL = "https://us-central1-whappu-183808.cloudfunctions.net";

function createChatForTwoUsers(matchRow) {
  console.log('createChatForTwoUsers');
  const current_url = `${BASE_URL}/addNewChatBetweenUsers?userId1=${matchRow.userId1}&userId2=${matchRow.userId2}`;
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
  const current_url = `${BASE_URL}/addPushTokenForUserId?userId=${userId}&pushToken=${pushToken}`;
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

function closeChatId(chatId) {
  console.log('closeChatId');
  const current_url = `${BASE_URL}/closeChatId?chatId=${chatId}`;
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
