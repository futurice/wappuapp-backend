const process = require('process');
const fetch = require('node-fetch');

const BASE_URL = process.env.FUNCTION_BASE_URL;

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

function removeUserId(userId) {
  console.log('removeUserIdFromChats ' + userId);
  const current_url = `${BASE_URL}/removeUserId?userId=${userId}`;
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

function closeChat(chatId) {
  console.log('closeChat');
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

function markRead(userId, type) {
  console.log('markRead');
  const current_url = `${BASE_URL}/markReadReceipt?userId=${userId}&type=${type}`;
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

function sendMatchNotification(userId1, userId2) {
  console.log('sendMatchNotification');
  const current_url = `${BASE_URL}/sendMatchNotification?userId1=${userId1}&userId2=${userId2}`;
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
  addPushNotificationTokenForUserId,
  removeUserId,
  markRead,
  sendMatchNotification,
  closeChat,
}
