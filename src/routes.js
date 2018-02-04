import express from 'express';
import passport from 'passport';

import passportService, {uuidCheck} from './util/passport'; //eslint-disable-line
import * as eventHttp from './http/event-http';
import * as actionHttp from './http/action-http';
import * as teamHttp from './http/team-http';
import * as userHttp from './http/user-http';
import * as actionTypeHttp from './http/action-type-http';
import * as feedHttp from './http/feed-http';
import * as announcementHttp from './http/announcement-http';
import * as voteHttp from './http/vote-http';
import * as markerHttp from './http/marker-http';
import * as citiesHttp from './http/cities-http';
import * as radioHttp from './http/radio-http';
import * as wappuMood from './http/wappu-mood-http';
import * as imageHttp from './http/image-http';
import * as heilaHttp from './http/heila-http';
import * as matchHttp from './http/match-http';
import * as feedbackHttp from './http/feedback-http';

import * as loginHttp from './http/login-http';
import * as adminHttp from './http/admin-http';
import * as abuseHttp from './http/abuse-http';

const requireAuth = passport.authenticate('jwt', {session: false});
const requireLogin = passport.authenticate('local', {session: false});
const requireAdmin = passport.authenticate('admin', {session: false});

function createRouter() {
  const router = express.Router();
  requireAuth.unless = require('express-unless')

  // palauttaa listan heiloja, joita voi frontissa näyttää heilanselauksessa
  // jos antaa query parametrin ?userId=jotakin, niin palauttaa vain tuota
  // userId:tä vastaavan heilan
  router.get('/heila/:uuid', heilaHttp.getHeilaList);
  router.get('/heila-types', heilaHttp.getHeilaTypes);
  router.post('/heila-report', heilaHttp.postHeilaReport);
  // päivittää oman heilaprofiilin tekstikenttätietoja
  router.put('/heila/:uuid', heilaHttp.putHeila);
  router.delete('/heila/:uuid', heilaHttp.deleteHeila);

  router.get('/heila/matches/:uuid', matchHttp.getMatches);
  router.post('/heila/matches', matchHttp.postMatch);
  router.post('/heila/matches/close', matchHttp.postMatchClose);

  router.get('/events', eventHttp.getEvents);
  router.get('/events/:id', eventHttp.getEvent);
  router.get('/allevents/:city_id', requireAuth, eventHttp.getAllEvents);
  router.post('/actions', actionHttp.postAction);
  router.get('/teams', teamHttp.getTeams);

  router.get('/users', userHttp.getUserById);
  router.put('/users/:uuid', userHttp.putUser);
  router.get('/users/:uuid', userHttp.getUserByUuid);
  router.put('/users/:uuid/image', userHttp.putUserImage);

  router.get('/action_types', actionTypeHttp.getActionTypes);

  router.get('/feed', feedHttp.getFeed);
  router.delete('/feed/:id', feedHttp.deleteFeedItem);
  router.put('/admin/feed/:id', requireAuth.unless(uuidCheck), adminHttp.deleteFeedItem);
  router.get('/image/:id', imageHttp.getImage);

  router.get('/announcements', announcementHttp.getAnnouncements);

  router.get('/markers', markerHttp.getMarkers);

  router.get('/cities', citiesHttp.getCities)

  router.put('/vote', voteHttp.putVote);

  router.post('/feedback/:id', feedbackHttp.postFeedback);

  router.get('/radio', radioHttp.getStations);
  router.get('/radio/:id', radioHttp.getStation);

  router.put('/mood', wappuMood.putMood);
  router.get('/mood', wappuMood.getMood);

  router.post('/login', requireLogin, loginHttp.login);
  router.post('/changepassword', requireAuth, loginHttp.changepw);
  router.post('/activateaccount', requireAuth, loginHttp.activateaccount);
  router.post('/addmoderator', requireAdmin, loginHttp.addmoderator);
  router.get('/forgottenpassword/:email', loginHttp.forgottenpw);
  router.put('/promote/:id', requireAdmin, loginHttp.promote);
  router.put('/demote/:id', requireAdmin, loginHttp.demote);
  router.put('/admin/users/:id/ban', requireAuth.unless(uuidCheck), adminHttp.shadowBanUser);
  router.put('/admin/users/:id/unban', requireAuth.unless(uuidCheck), adminHttp.unBanUser);
  router.delete('/deletemoderator/:id', requireAdmin, loginHttp.deletemoderator);
  router.get('/moderatorlist', requireAdmin, loginHttp.modlist);
  router.post('/addevent', requireAuth, eventHttp.addEvent);
  router.delete('/deleteevent/:id', requireAuth, eventHttp.deleteEvent);
  router.post('/updateevent/:id', requireAuth, eventHttp.updateEvent);
  router.get('/updateevent/:id', requireAuth, eventHttp.getUpdateEvent);

  router.post('/reports', abuseHttp.reportFeedItem);
  router.put('/admin/reports/:id', requireAuth, abuseHttp.resolveReport);

  return router;
}

export default createRouter;
