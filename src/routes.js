import express from 'express';
import passport from 'passport';

import passportService from './util/passport'; //eslint-disable-line
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


const requireAuth = passport.authenticate('jwt', {session: false});
const requireLogin = passport.authenticate('local', {session: false});
const requireAdmin = passport.authenticate('admin', {session: false});

function createRouter() {
  const router = express.Router();

  router.get('/events', eventHttp.getEvents);
  router.get('/events/:id', eventHttp.getEvent);

  router.post('/actions', actionHttp.postAction);
  router.get('/teams', teamHttp.getTeams);

  router.get('/users', userHttp.getUserById);
  router.put('/users/:uuid', userHttp.putUser);
  router.get('/users/:uuid', userHttp.getUserByUuid);

  router.get('/action_types', actionTypeHttp.getActionTypes);

  router.get('/feed', feedHttp.getFeed);
  router.delete('/feed/:id', feedHttp.deleteFeedItem);
  router.delete('/admin/feed/:id', requireAuth, adminHttp.deleteFeedItem);
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
  router.post('/changepassword', requireAuth, loginHttp.changepw);
  router.post('/addmoderator', requireAdmin, loginHttp.addmoderator);
  router.get('/forgottenpassword/:email', loginHttp.forgottenpw);
  router.put('/promote/:email', requireAdmin, loginHttp.promote);
  router.put('/demote/:email', requireAdmin, loginHttp.demote);
  router.put('/admin/users/:uuid/ban', requireAuth, adminHttp.shadowBanUser);
  router.put('/admin/users/:uuid/unban', requireAuth, adminHttp.unBanUser);
  router.delete('/deletemoderator/:email', requireAdmin, loginHttp.deletemoderator);

  return router;
}

export default createRouter;
