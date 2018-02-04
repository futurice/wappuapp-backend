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
import * as loginHttp from './http/login-http';
import * as adminHttp from './http/admin-http';
import * as abuseHttp from './http/abuse-http';

const requireAuth = passport.authenticate('jwt', {session: false});
const requireLogin = passport.authenticate('local', {session: false});
const requireAdmin = passport.authenticate('admin', {session: false});

function createRouter() {
  const router = express.Router();
  requireAuth.unless = require('express-unless')
  router.get('/events', eventHttp.getEvents);
  router.get('/events/:id', eventHttp.getEvent);
  router.get('/allevents/:city_id', requireAuth, eventHttp.getAllEvents);
  router.post('/actions', actionHttp.postAction);
  router.get('/teams', teamHttp.getTeams);

  router.get('/users', userHttp.getUserById);
  router.put('/users/:uuid', userHttp.putUser);
  router.get('/users/:uuid', userHttp.getUserByUuid);

  router.get('/action_types', actionTypeHttp.getActionTypes);

  router.get('/feed', feedHttp.getFeed);
  router.delete('/feed/:id', feedHttp.deleteFeedItem);
  router.put('/admin/feed/:id', requireAuth.unless(uuidCheck), adminHttp.deleteFeedItem);
  router.get('/image/:id', imageHttp.getImage);

  router.get('/announcements', announcementHttp.getAnnouncements);

  router.get('/markers', markerHttp.getMarkers);

  router.get('/cities', citiesHttp.getCities)

  router.put('/vote', voteHttp.putVote);

  router.get('/radio', radioHttp.getStations);
  router.get('/radio/:id', radioHttp.getStation);

  router.put('/mood', wappuMood.putMood);
  router.get('/mood', wappuMood.getMood);

  router.post('/login', requireLogin, loginHttp.login);
  router.post('/changepassword', requireAuth, loginHttp.changePW);
  router.post('/activateaccount', requireAuth, loginHttp.activateAccount);
  router.post('/addmoderator', requireAdmin, loginHttp.addModerator);
  router.get('/forgottenpassword/:email', loginHttp.forgottenPW);
  router.put('/promote/:id', requireAdmin, loginHttp.promote);
  router.put('/demote/:id', requireAdmin, loginHttp.demote);
  router.put('/admin/users/:id/ban', requireAuth.unless(uuidCheck), adminHttp.shadowBanUser);
  router.put('/admin/users/:id/unban', requireAuth.unless(uuidCheck), adminHttp.unBanUser);
  router.delete('/deletemoderator/:id', requireAdmin, loginHttp.deleteModerator);
  router.get('/moderatorlist', requireAdmin, loginHttp.modList);
  router.post('/addevent', requireAuth, eventHttp.addEvent);
  router.delete('/deleteevent/:id', requireAuth, eventHttp.deleteEvent);
  router.post('/updateevent/:id', requireAuth, eventHttp.updateEvent);
  router.get('/updateevent/:id', requireAuth, eventHttp.getUpdateEvent);
  router.post('/admin/actions', requireAuth, adminHttp.sendSystemMessage);
  router.get('/refreshcommentnumber/:id', feedHttp.refreshCommentNumber);

  router.post('/reports', abuseHttp.reportFeedItem);
  router.get('/admin/reports', requireAuth, abuseHttp.getReportedFeedItems);
  router.put('/admin/reports/:id', requireAuth, abuseHttp.resolveReport);

  return router;
}

export default createRouter;
