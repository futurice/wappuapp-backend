const fetch = require('node-fetch');

const URL_CREATE_CHAT = "https://us-central1-whappu-183808.cloudfunctions.net/addNewChatBetweenUsers";

function createChatForTwoUsers(matchRow) {
  console.log('createChatForTwoUsers');
  const current_url = `${URL_CREATE_CHAT}?userId1=${matchRow.userId1}&userId2=${matchRow.userId2}`;
  console.log(current_url);
  return fetch(current_url, {
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
  })
  .then(res => res.json())
  .then(fullChatUrl => {
    console.log(fullChatUrl)
    const chatId = fullChatUrl.split("/").slice(-1)[0];
    return chatId;
  })
}

export {
  createChatForTwoUsers
}
