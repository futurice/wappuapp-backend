const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

// THIS FUNCTION ADDS PUSHTOKEN FOR USERID
exports.addPushTokenForUserId = functions.https.onRequest((req, res) => {
  const userId = req.query.userId;
  const pushToken = req.query.pushToken;

  admin.database().ref('/pushTokens/' + userId).set({token: pushToken}).then(snapshot => {
    console.log('pushToken added for userId ' + userId);
    res.sendStatus(200);
  });

});

exports.addNewChatBetweenUsers = functions.https.onRequest((req, res) => {
  const userId1 = req.query.userId1;
  const userId2 = req.query.userId2;

  admin.database().ref('/chats/').push({ messages: [], users: [userId1, userId2] }).then(snapshot => {
    console.log('chat record was added for users ' + userId1 + ' and ' + userId2);
    console.log(snapshot)
    res.send(snapshot.ref);
  });
});

// OFFICIAL EXAMPLE FOR TRIGGERING GCF ON WRITE
//
// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
//exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    //.onWrite(event => {
      //// Grab the current value of what was written to the Realtime Database.
      //const original = event.data.val();
      //console.log('Uppercasing', event.params.pushId, original);
      //const uppercase = original.toUpperCase();
      //// You must return a Promise when performing asynchronous tasks inside a Functions such as
      //// writing to the Firebase Realtime Database.
      //// Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      //return event.data.ref.parent.child('uppercase').set(uppercase);
    //});
//
// THIS TRIGGERS ON WRITE @ /chats/whatever
// --> check if receiver has enabled notifications
// --> send a push notif
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
    return admin.database().ref('/pushTokens').once('value').then(snapshot => {

      const userIdObject = snapshot.val();
      console.log('looking for pushToken for userId ' + userIdForReceiver);
      console.log('all pushToken userIds are: ' + Object.keys(userIdObject));

      if (userIdForReceiver in userIdObject) {
        const pushToken = userIdObject[userIdForReceiver];
        console.log('FOUND');
        console.log(pushToken);

        // See the "Defining the message payload" section below for details
        // on how to define a message payload.
        // NOTE: the notification dictionary HAS TO BE HERE
        // read this: https://firebase.google.com/docs/cloud-messaging/concept-options#notifications
        var payload = {
          notification: {
            title: 'WappuNotif!',
            body: 'jep :-)'
          },
          data: {
            kv1: 'any data here',
            kv2: 'any data here, too'
          }
        };

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
        console.log('NOT FOUND');
      }
    })
  });

