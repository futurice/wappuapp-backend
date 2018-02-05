
* functions has been documented in index.js
* in order to modify functions, modify index.js

* deploy functions with:
  firebase deploy --only functions
* serve functions locally for debugging etc.:
  firebase serve --only functions 

* database.rules.json should be uploaded to firebase database

* all firebase functions are called from core/function-core
* match-core and heila-core call functions in function-core

* the schema of the database looks like this:

{
  chats: {
    random_id: {
      users: [userId1, userId2],
      messages: [
        { ts: timestamp in millisecondes since unix epoch,
          userId: userId of the message sender,
          msg: string message },
        .
        .
        .
      ],
      closed: true // when a chat is closed, this field is set to true
                   // the security rules check whether this field is true 
                   // ---> if true, reading access is denied

    },
    .
    .
    .
  },
  pushTokens: {
    userId: {
      token: push token string
    },
  .
  .
  .
  },
  readReceipts: {
    userId: {
      match: true|false, // checked upon deciding on sending push notif
      msg: true|false    // if true -> user has read the previous --> send notif
                         // if false -> do not send a push notif
    },
    .
    .
    .
  }
}

