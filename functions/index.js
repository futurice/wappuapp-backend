const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Create and Deploy Your First Cloud Functions
// OFFICIAL DOCUMENTATION
// https://firebase.google.com/docs/functions/write-firebase-functions


// THIS FUNCTION ADDS PUSHTOKEN FOR USERID
exports.addPushTokenForUserId = functions.https.onRequest((req, res) => {

  if (req.get('FUNCTION_SECRET_KEY') !== functions.config().functions.secret) {
    console.log('not authenticated, FUNCTION_SECRET_KEY header is barps');
    res.sendStatus(403);
    return;
  }

  const userId = req.query.userId;
  const pushToken = req.query.pushToken;

  admin.database().ref('/pushTokens/' + userId).set({token: pushToken}).then(snapshot => {
    console.log('pushToken added for userId ' + userId);
    res.sendStatus(200);
  });
});

// this function takes an userId as an argument and removes that user's
// pushToken from the database. after this the user will not receive any
// push notifications from the service anymore.
exports.removeUserId = functions.https.onRequest((req, res) => {

  if (req.get('FUNCTION_SECRET_KEY') !== functions.config().functions.secret) {
    console.log('not authenticated, FUNCTION_SECRET_KEY header is barps');
    res.sendStatus(403);
    return;
  }

  const userId = req.query.userId;

  return admin.database().ref('/pushTokens/' + userId).set({ token: null }).then(snapshot => {
    console.log('pushToken removed from userId ' + userId);
    // return admin.database().ref('/chats/').once('value').then(snapshot => {
    //   const allChats = snapshot.val();
    //   const chatsToClose = [];
    //   Object.keys(allChats).forEach(key => {
    //     if (allChats[key].users[0] == userId || allChats[key].users[1] == userId) {
    //       chatsToClose.push(key);
    //     }
    //   });
    //   // these are the keys for chats of this userId
    //   // TODO: it should be decided what to do with them
    //   // leave open, close them?
    //   // should the other user be notified somehow?
    //   console.log('chatsToClose:');
    //   console.log(chatsToClose);
    // });
    res.sendStatus(200);
  });

});

// this function adds a new chat between two users
// the chat will be in /messages and it will have a random key
// there will be an initial message in the chat which can be tuned below
exports.addNewChatBetweenUsers = functions.https.onRequest((req, res) => {

  if (req.get('FUNCTION_SECRET_KEY') !== functions.config().functions.secret) {
    console.log('not authenticated, FUNCTION_SECRET_KEY header is barps');
    res.sendStatus(403);
    return;
  }

  console.log(req.query)
  const userId1 = req.query.userId1;
  const userId2 = req.query.userId2;

  return admin.database().ref('/chats/')
         .push({
           messages: [],
           users: [userId1, userId2]
         })
    .then(snapshot => {
      console.log('chat record was added for users ' + userId1 + ' and ' + userId2);
      const chatKey = snapshot.ref.toString().split('/').slice(-1)[0];
      console.log(`chatKey: ${chatKey}`);
      res.send({ 'chatKey': chatKey });
      return admin.database().ref(`/chats/${chatKey}/messages`)
             .push({
               msg: 'Welcome to whappu chat! Please do not share any private information.',
               userId: '-1',
               ts: (new Date()).getTime().toString()
             })
    });
});

// this function is called from other functions that want to send a push notification
// --> when a match is done AND when there's a new chat message
function sendPushMessageToUserDeviceWithPayload(userId, payload) {
    return admin.database().ref('/pushTokens').once('value').then(snapshot => {

      // /pushTokens is an object of this form:
      // {
      //   userIdX: { token: pushTokenString },
      //   userIdY: { token: pushTokenString },
      //   ...
      // }

      const userIdObject = snapshot.val();
      console.log('looking for pushToken for userId ' + userId);
      console.log('all pushToken userIds are: ' + Object.keys(userIdObject));

      if (userId in userIdObject) {
        const pushToken = userIdObject[userId]['token'];
        console.log(`pushToken FOUND for userId ${userId}`);
        console.log(pushToken);

        // See the "Defining the message payload" section below for details
        // on how to define a message payload.
        // NOTE: the notification dictionary HAS TO BE HERE
        // read this: https://firebase.google.com/docs/cloud-messaging/concept-options#notifications

        // something like this:
        //   var payload = {
          //   notification: {
          //     title: 'WappuNotif!',
          //     body: 'jep :-)'
          //   },
          //   data: {
          //     kv1: 'any data here',
          //     kv2: 'any data here, too'
          //   }
          // };

        // Send a message to the device corresponding to the provided
        // registration token.
        admin.messaging().sendToDevice(pushToken, payload)
          .then(function(response) {
            // See the MessagingDevicesResponse reference documentation for
            // the contents of response.
            console.log("Successfully sent message:", response);
          })
          .catch(function(error) {
            console.log("Error sending message:", error);
          });

      } else {
        console.log(`userId ${userId} did not have pushToken... abort sending!`);
      }
    })
};

// THIS TRIGGERS ON WRITE @ /chats/whatever
// figure out who should receive a message
// call the message sending logic
// the receiver of this message is the other person in the chat
// ----> first get the new message's sender
// ----> figure out the second party in the chat
exports.sendPushMessage = functions.database.ref('/chats/{chatId}/')
  .onWrite(event => {
    // Grab the current value of what was written to the Realtime Database.
    const chatData = event.data.val();
    console.log('\ŋ\ŋthere was a new write to ' + event.params.chatId);
    console.log(chatData)
    const users = chatData.users;
    const lastMessageId = Object.keys(chatData.messages).slice(-1)[0];
    const userIdForSender = chatData.messages[lastMessageId].userId;
    const userIdForReceiver = users.filter(id => id !== userIdForSender)[0];
    console.log(users)
    console.log(userIdForSender)
    console.log(userIdForReceiver)

    const payload = {
      notification: {
        title: 'Whappu!',
        body: 'You have a new message!'
      }
    };
    return updateReadReceiptAndSendPushNotification(userIdForReceiver, 'msg', payload);
})

// this writes "closed": true to chats/chatId and so closes the chat
// for writing. reading will still be allowed.
exports.closeChatId = functions.https.onRequest((req, res) => {

  if (req.get('FUNCTION_SECRET_KEY') !== functions.config().functions.secret) {
    console.log('not authenticated, FUNCTION_SECRET_KEY header is barps');
    res.sendStatus(403);
    return;
  }

  console.log(req.query)
  const chatId = req.query.chatId;

  return admin.database().ref(`/chats/${chatId}`)
    .update({
      'closed': true
    })
    .then(r => {
      res.sendStatus(200);
    })
});

// this function sends a match notification
exports.sendMatchNotification = functions.https.onRequest((req, res) => {

  if (req.get('FUNCTION_SECRET_KEY') !== functions.config().functions.secret) {
    console.log('not authenticated, FUNCTION_SECRET_KEY header is barps');
    res.sendStatus(403);
    return;
  }

  console.log(req.query);

  const userId = req.query.userId;
  const payload = {
    notification: {
      title: 'Whappu!',
      body: 'You have a new match!'
    }
  };
  return updateReadReceiptAndSendPushNotification(userId, 'match', payload);
  res.sendStatus(200);
});

// this handles readreceipt logic
function updateReadReceiptAndSendPushNotification(userId, receiptType, payload) {

  // this first grabs the user's current readReceipt status
  // if it doesn't exist or the value is true
  // --> lets create it or change the value to false
  // --> send a push notification
  // if it exists and the value is false
  // --> do nothing since the user has not read the earlier notification
  // --> this prevents sending multiple notifications to the user's device
  // --> only one per notification type (match/msg)
  return admin.database().ref(`/readReceipts/${userId}`).once('value', snapshot => {
    const receiptData = snapshot.val();
    console.log(receiptData);
    // the user has not read the p
    if (receiptData && receiptData[receiptType] === false) {
      console.log('user has not read the previous match notification -> abort');
      return;
    }

    return admin.database().ref(`/readReceipts/${userId}`)
      .update({ receiptType: false })
      .then(r => {
        console.log('readReceipt data updated');
        return sendPushMessageToUserDeviceWithPayload(userId, payload);
      })
    });
};

exports.markRead = functions.https.onRequest((req, res) => {

  if (req.get('FUNCTION_SECRET_KEY') !== functions.config().functions.secret) {
    console.log('not authenticated, FUNCTION_SECRET_KEY header is barps');
    res.sendStatus(403);
    return;
  }

  console.log(req.query);

  const userId = req.query.userId;
  const type = req.query.type;
  const obj = {};
  obj[type] = true;

  return admin.database().ref(`/readReceipts/${userId}`)
    .update(obj)
    .then(r => {
      console.log('readReceipt marked read');
    });
});
