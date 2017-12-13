import { createJsonRoute } from '../util/express';

const getMatches = createJsonRoute(function(req, res) {
  return new Promise(res => {
    res([
    { chatId: 666, userId: 1, name: "Petteri", image_url: "https://storage.googleapis.com/whappu-backend/profile_pictures/4bd759c0-e01c-11e7-be6e-dd6be0ad9757" },
    { chatId: 777, userId: 2, name: "Puna", image_url: "https://storage.googleapis.com/whappu-backend/profile_pictures/4bd759c0-e01c-11e7-be6e-dd6be0ad9757"  },
    { chatId: 888, userId: 3, name: "Kuono", image_url: "https://storage.googleapis.com/whappu-backend/profile_pictures/4bd759c0-e01c-11e7-be6e-dd6be0ad9757" }
  ])
  })
});

const getChat = createJsonRoute(function(req, res) {
  
  return new Promise(res => {
    res({
    chatId: req.params.id,
    myUserId: 1,
    otherUserId: 2,
    messages: [
      { user: 1, msg: "hihii" },
      { user: 2, msg: "hehee" },
      { user: 1, msg: "kaljaa?" },
      { user: 2, msg: "makkaraa!" },
    ]
  })
  })
});
  

export {
  getMatches,
  getChat
}
